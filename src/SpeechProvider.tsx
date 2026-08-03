import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getSpeechVoices,
  isSpeechSupported,
  joinForSpeech,
  loadSpeechSettings,
  saveSpeechSettings,
  selectSpeechVoice,
  shouldAutoRead,
  speak,
  stopSpeaking,
  voiceProfileForAge,
  type SpeechSettings,
  type SpeechVoicePreference,
} from "./speech";

type SayOptions = {
  /** Stable control id; only this control shows the stop state. */
  id?: string;
  onDone?: () => void;
  /** Fifi gets a brighter character delivery without changing lesson voices. */
  style?: "default" | "fifi";
};

export type SpeechVoiceOption = SpeechVoicePreference & {
  lang: string;
  localService: boolean;
  default: boolean;
};

type SpeechContextValue = {
  settings: SpeechSettings;
  updateSettings: (patch: Partial<SpeechSettings>) => void;
  available: boolean;
  autoRead: boolean;
  ageWorld: number;
  /** Voices may arrive asynchronously after the first screen paints. */
  voices: SpeechVoiceOption[];
  selectedVoice: SpeechVoiceOption | null;
  say: (text: string, options?: SayOptions) => boolean;
  stop: () => void;
  speakingId: string | null;
};

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ ageWorld, children }: { ageWorld: number; children: ReactNode }) {
  const [settings, setSettings] = useState<SpeechSettings>(() => loadSpeechSettings());
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const supported = useMemo(() => isSpeechSupported(), []);
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>(() => getSpeechVoices());
  const requestRef = useRef(0);

  useEffect(() => {
    if (!supported) return undefined;
    const refreshVoices = () => setNativeVoices(getSpeechVoices());
    refreshVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", refreshVoices);
  }, [supported]);

  const selectedNativeVoice = useMemo(
    () => selectSpeechVoice(nativeVoices, ageWorld, settings.voice),
    [nativeVoices, ageWorld, settings.voice],
  );

  const voices = useMemo<SpeechVoiceOption[]>(() => nativeVoices
    .filter((voice) => /^en(?:[-_]|$)/i.test(voice.lang || ""))
    .map((voice) => ({
      voiceURI: voice.voiceURI || "",
      name: voice.name || "Unnamed voice",
      lang: voice.lang || "",
      localService: voice.localService === true,
      default: voice.default === true,
    }))
    .sort((first, second) => Number(second.localService) - Number(first.localService) || first.name.localeCompare(second.name)), [nativeVoices]);

  const selectedVoice = useMemo<SpeechVoiceOption | null>(() => selectedNativeVoice ? {
    voiceURI: selectedNativeVoice.voiceURI || "",
    name: selectedNativeVoice.name || "Unnamed voice",
    lang: selectedNativeVoice.lang || "",
    localService: selectedNativeVoice.localService === true,
    default: selectedNativeVoice.default === true,
  } : null, [selectedNativeVoice]);

  const updateSettings = useCallback((patch: Partial<SpeechSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSpeechSettings(next);
      if (!next.enabled) {
        requestRef.current += 1;
        stopSpeaking();
        setSpeakingId(null);
      }
      return next;
    });
  }, []);

  const available = supported && settings.enabled;

  const say = useCallback((text: string, options: SayOptions = {}) => {
    if (!available) return false;
    const request = ++requestRef.current;
    setSpeakingId(options.id || null);
    const profile = voiceProfileForAge(settings, ageWorld);
    const fifiStyle = options.style === "fifi";
    const started = speak(text, {
      rate: fifiStyle ? Math.max(0.58, profile.rate - 0.03) : profile.rate,
      pitch: fifiStyle ? Math.min(1.3, profile.pitch + (ageWorld <= 1 ? 0.12 : 0.08)) : profile.pitch,
      voice: selectedNativeVoice,
      onDone: () => {
        if (requestRef.current !== request) return;
        setSpeakingId(null);
        options.onDone?.();
      },
    });
    if (!started && requestRef.current === request) setSpeakingId(null);
    return started;
  }, [available, settings, ageWorld, selectedNativeVoice]);

  const stop = useCallback(() => {
    requestRef.current += 1;
    stopSpeaking();
    setSpeakingId(null);
  }, []);

  // A newly chosen voice should never switch midway through an utterance.
  useEffect(() => stop, [settings.voice, stop]);

  useEffect(() => {
    const handleHidden = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", handleHidden);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [stop]);

  const value = useMemo<SpeechContextValue>(() => ({
    settings,
    updateSettings,
    available,
    autoRead: available && shouldAutoRead(settings, ageWorld),
    ageWorld,
    voices,
    selectedVoice,
    say,
    stop,
    speakingId,
  }), [settings, updateSettings, available, ageWorld, voices, selectedVoice, say, stop, speakingId]);

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}

export function useSpeech(): SpeechContextValue {
  return useContext(SpeechContext) || {
    settings: loadSpeechSettings(),
    updateSettings: () => undefined,
    available: false,
    autoRead: false,
    ageWorld: 1,
    voices: [],
    selectedVoice: null,
    say: () => false,
    stop: () => undefined,
    speakingId: null,
  };
}

export function SpeakButton({
  text,
  id,
  label = "Listen",
  className = "",
  voiceStyle = "default",
}: {
  text: Array<string | undefined | null> | string;
  id: string;
  label?: string;
  className?: string;
  voiceStyle?: "default" | "fifi";
}) {
  const { available, say, stop, speakingId } = useSpeech();
  const spoken = useMemo(() => (Array.isArray(text) ? joinForSpeech(...text) : joinForSpeech(text)), [text]);
  const talking = speakingId === id;

  if (!available || !spoken) return null;

  const toggle = () => {
    if (talking) {
      stop();
      return;
    }
    // `say` owns both the native utterance and the visual state. If a WebView
    // rejects speech synchronously or never begins, it clears the button again.
    say(spoken, { id, style: voiceStyle });
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

export function useSpeakOnChange(message: string | undefined | null) {
  const { autoRead, say } = useSpeech();
  const previous = useRef("");
  const initialized = useRef(false);

  useEffect(() => {
    const text = joinForSpeech(message || "");
    if (!autoRead) return;
    if (!initialized.current) {
      initialized.current = true;
      previous.current = text;
      return;
    }
    if (!text) return;
    if (previous.current === text) return;
    previous.current = text;
    say(text);
  }, [message, autoRead, say]);
}

export function useAutoSpeak(text: Array<string | undefined | null> | string, key: string) {
  const { autoRead, say, stop } = useSpeech();
  const spoken = useMemo(() => (Array.isArray(text) ? joinForSpeech(...text) : joinForSpeech(text)), [text]);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!autoRead || !spoken || lastKey.current === key) return undefined;
    const timer = window.setTimeout(() => {
      lastKey.current = key;
      say(spoken);
    }, 350);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [autoRead, spoken, key, say, stop]);
}
