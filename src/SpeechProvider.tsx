import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  isSpeechSupported,
  joinForSpeech,
  loadSpeechSettings,
  rateForAge,
  saveSpeechSettings,
  shouldAutoRead,
  speak,
  stopSpeaking,
  type SpeechSettings,
} from "./speech";

type SpeechContextValue = {
  settings: SpeechSettings;
  updateSettings: (patch: Partial<SpeechSettings>) => void;
  /** True when this device can speak and the grown-up has left read-aloud on. */
  available: boolean;
  /** True when a screen should read its main prompt aloud as it opens. */
  autoRead: boolean;
  ageWorld: number;
  say: (text: string) => void;
  stop: () => void;
  speakingId: string | null;
  setSpeakingId: (id: string | null) => void;
};

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ ageWorld, children }: { ageWorld: number; children: ReactNode }) {
  const [settings, setSettings] = useState<SpeechSettings>(() => loadSpeechSettings());
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const supported = useMemo(() => isSpeechSupported(), []);

  const updateSettings = useCallback((patch: Partial<SpeechSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSpeechSettings(next);
      if (!next.enabled) stopSpeaking();
      return next;
    });
  }, []);

  const available = supported && settings.enabled;

  const say = useCallback((text: string) => {
    if (!available) return;
    speak(text, { rate: rateForAge(settings, ageWorld) });
  }, [available, settings, ageWorld]);

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeakingId(null);
  }, []);

  // Never leave a voice talking after the app is closed or backgrounded.
  useEffect(() => {
    const handleHidden = () => {
      if (document.visibilityState === "hidden") stopSpeaking();
    };
    document.addEventListener("visibilitychange", handleHidden);
    window.addEventListener("pagehide", stopSpeaking);
    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
      window.removeEventListener("pagehide", stopSpeaking);
      stopSpeaking();
    };
  }, []);

  const value = useMemo<SpeechContextValue>(() => ({
    settings,
    updateSettings,
    available,
    autoRead: available && shouldAutoRead(settings, ageWorld),
    ageWorld,
    say,
    stop,
    speakingId,
    setSpeakingId,
  }), [settings, updateSettings, available, ageWorld, say, stop, speakingId]);

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}

/**
 * Components deep in the tree may render in tests without a provider; returning
 * an inert value keeps read-aloud strictly additive rather than load-bearing.
 */
export function useSpeech(): SpeechContextValue {
  return useContext(SpeechContext) || {
    settings: loadSpeechSettings(),
    updateSettings: () => undefined,
    available: false,
    autoRead: false,
    ageWorld: 1,
    say: () => undefined,
    stop: () => undefined,
    speakingId: null,
    setSpeakingId: () => undefined,
  };
}

/**
 * A tap-to-hear speaker. Renders nothing when the device cannot speak or a
 * grown-up has turned read-aloud off, so no dead control is ever shown.
 */
export function SpeakButton({
  text,
  id,
  label = "Listen",
  className = "",
}: {
  /** Fragments to read; empty ones are skipped and the rest joined with pauses. */
  text: Array<string | undefined | null> | string;
  /** Stable id so only the button currently talking shows the stop state. */
  id: string;
  label?: string;
  className?: string;
}) {
  const { available, say, stop, speakingId, setSpeakingId, settings, ageWorld } = useSpeech();
  const spoken = useMemo(() => (Array.isArray(text) ? joinForSpeech(...text) : joinForSpeech(text)), [text]);
  const talking = speakingId === id;

  useEffect(() => () => { if (talking) stopSpeaking(); }, [talking]);

  if (!available || !spoken) return null;

  const toggle = () => {
    if (talking) {
      stop();
      return;
    }
    setSpeakingId(id);
    speak(spoken, {
      rate: rateForAge(settings, ageWorld),
      onDone: () => setSpeakingId(null),
    });
    void say;
  };

  return (
    <button
      type="button"
      className={`speak-button ${talking ? "speaking" : ""} ${className}`.trim()}
      onClick={toggle}
      aria-label={talking ? "Stop reading aloud" : `${label} — read this aloud`}
      title={talking ? "Stop reading" : "Read this aloud"}
    >
      <span aria-hidden="true">{talking ? "⏹" : "🔊"}</span>
      <small>{talking ? "Stop" : label}</small>
    </button>
  );
}

/**
 * Speak coaching feedback the moment it appears — the "not quite, here is why"
 * line is the most important text on a puzzle screen and the least likely to be
 * read by the children who need it. Skips the first render so opening a screen
 * doesn't read its placeholder instruction twice.
 */
export function useSpeakOnChange(message: string | undefined | null) {
  const { autoRead, settings, ageWorld } = useSpeech();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const text = joinForSpeech(message || "");
    if (!autoRead || !text) return;
    if (previous.current === null) {
      previous.current = text;
      return;
    }
    if (previous.current === text) return;
    previous.current = text;
    speak(text, { rate: rateForAge(settings, ageWorld) });
  }, [message, autoRead, settings, ageWorld]);
}

/**
 * Read a screen's main prompt aloud when it opens, for children who cannot read.
 * Re-speaks whenever the content changes (a new lesson, puzzle or lab), and
 * cancels cleanly if the child navigates away mid-sentence.
 */
export function useAutoSpeak(text: Array<string | undefined | null> | string, key: string) {
  const { autoRead, settings, ageWorld } = useSpeech();
  const spoken = useMemo(() => (Array.isArray(text) ? joinForSpeech(...text) : joinForSpeech(text)), [text]);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!autoRead || !spoken || lastKey.current === key) return undefined;
    lastKey.current = key;
    // A short delay lets the screen paint and the previous view's audio stop,
    // so the child sees what is about to be read to them.
    const timer = window.setTimeout(() => speak(spoken, { rate: rateForAge(settings, ageWorld) }), 350);
    return () => {
      window.clearTimeout(timer);
      stopSpeaking();
    };
  }, [autoRead, spoken, key, settings, ageWorld]);
}
