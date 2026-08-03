/**
 * On-device read-aloud for ColorQuest Kids.
 *
 * Uses the Web Speech API, which synthesises speech locally in the WebView.
 * No audio is recorded, uploaded, or sent anywhere: nothing here touches the
 * network, so read-aloud costs nothing in privacy terms and works offline.
 *
 * Every export is safe to call on a platform with no speech support — the
 * module degrades to a silent no-op rather than throwing.
 */

export type SpeechSettings = {
  /** Master switch. When false nothing is ever spoken and buttons are hidden. */
  enabled: boolean;
  /** Speaking rate, 0.5 (very slow) to 1.2 (brisk). Younger children need slower. */
  rate: number;
  /**
   * Read the main prompt aloud automatically when a screen opens.
   * Defaults to on for the two youngest age worlds, where children cannot read.
   */
  autoRead: "young" | "always" | "never";
};

export const SPEECH_STORAGE_KEY = "colorquest-speech-v1";

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  enabled: true,
  rate: 0.85,
  autoRead: "young",
};

export function loadSpeechSettings(): SpeechSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SPEECH_SETTINGS };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SPEECH_STORAGE_KEY) || "null") as Partial<SpeechSettings> | null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SPEECH_SETTINGS };
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SPEECH_SETTINGS.enabled,
      rate: typeof parsed.rate === "number" && parsed.rate >= 0.5 && parsed.rate <= 1.2 ? parsed.rate : DEFAULT_SPEECH_SETTINGS.rate,
      autoRead: parsed.autoRead === "always" || parsed.autoRead === "never" || parsed.autoRead === "young"
        ? parsed.autoRead
        : DEFAULT_SPEECH_SETTINGS.autoRead,
    };
  } catch {
    return { ...DEFAULT_SPEECH_SETTINGS };
  }
}

export function saveSpeechSettings(settings: SpeechSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SPEECH_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage full or blocked — speech still works for this session */
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined"
    && "speechSynthesis" in window
    && typeof window.SpeechSynthesisUtterance === "function";
}

/**
 * Should a screen read itself aloud on open, for this child?
 * `ageWorld` is 0–3 (ages 1–3, 4–6, 7–9, 10–12).
 */
export function shouldAutoRead(settings: SpeechSettings, ageWorld: number): boolean {
  if (!settings.enabled) return false;
  if (settings.autoRead === "never") return false;
  if (settings.autoRead === "always") return true;
  return ageWorld <= 1;
}

/** Slower for the youngest children, closer to normal for the oldest. */
export function rateForAge(settings: SpeechSettings, ageWorld: number): number {
  const adjustment = ageWorld <= 0 ? -0.1 : ageWorld === 1 ? -0.05 : ageWorld === 3 ? 0.05 : 0;
  return Math.min(1.2, Math.max(0.5, settings.rate + adjustment));
}

/**
 * Symbols that carry meaning in a maths or science prompt and must survive into
 * the spoken text. Anything not listed here that is non-verbal gets dropped,
 * because a speech engine reading "grinning face, sparkles" out of a prompt is
 * worse than silence.
 */
const SPOKEN_SYMBOLS: Array<[RegExp, string]> = [
  [/(\d)\s*×\s*(\d)/g, "$1 times $2"],
  [/(\d)\s*÷\s*(\d)/g, "$1 divided by $2"],
  [/(\d)\s*\+\s*(\d)/g, "$1 plus $2"],
  [/(\d)\s*−\s*(\d)/g, "$1 minus $2"],
  [/(\d)\s*-\s*(\d)/g, "$1 minus $2"],
  [/(\d)\s*=\s*(\d)/g, "$1 equals $2"],
  [/(\d)\s*\/\s*(\d)/g, "$1 over $2"],
  [/(\d+)\s*°/g, "$1 degrees"],
  [/\bkm\/h\b/g, "kilometres per hour"],
  [/\bkm\b/g, "kilometres"],
  [/(\d)\s*m\b/g, "$1 metres"],
  [/\bcm\b/g, "centimetres"],
  [/\bHz\b/g, "hertz"],
  [/\bCO₂\b/g, "carbon dioxide"],
  [/\bly\b/g, "light year"],
  [/(\d)\s*%/g, "$1 percent"],
  [/10\^(\d+)/g, "ten to the power of $1"],
  [/\b(\d+)²/g, "$1 squared"],
];

/**
 * Turn on-screen text into something worth listening to.
 *
 * Emoji and pictographs are stripped rather than spoken: they are decoration in
 * this app, and screen-reader-style enumeration of them ("rocket, sparkles")
 * makes prompts unintelligible for exactly the children who need the audio.
 */
export function toSpokenText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  for (const [pattern, replacement] of SPOKEN_SYMBOLS) text = text.replace(pattern, replacement);
  return text
    // Emoji, pictographs, dingbats, flags, variation selectors and ZWJ.
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{E0020}-\u{E007F}]/gu, " ")
    // Geometric shape glyphs used as answer choices (● ■ ▲ ◆ ★ ♥ ◼ ◻).
    .replace(/[\u{25A0}-\u{25FF}\u{2660}-\u{2669}]/gu, " ")
    // Typographic quotes and dashes read poorly; normalise them.
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[·—–]/g, ", ")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/(^[,\s]+)|([,\s]+$)/g, "")
    .trim();
}

/** Join several fragments into one utterance with natural pauses between them. */
export function joinForSpeech(...parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => toSpokenText(part || ""))
    .filter((part) => part.length > 0)
    .join(". ")
    .replace(/\.\s*\./g, ".");
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/** Stop anything currently being spoken. Safe to call at any time. */
export function stopSpeaking() {
  if (!isSpeechSupported()) return;
  try {
    activeUtterance = null;
    window.speechSynthesis.cancel();
  } catch {
    /* some WebViews throw if synthesis was never started */
  }
}

export type SpeakOptions = {
  rate?: number;
  /** Called when the utterance finishes, is cancelled, or fails. */
  onDone?: () => void;
};

/**
 * Speak a piece of text, replacing whatever was being spoken before.
 * Returns false when nothing was spoken (unsupported platform or empty text),
 * so callers can keep their UI in a consistent state.
 */
export function speak(raw: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) return false;
  const text = toSpokenText(raw);
  if (!text) return false;

  stopSpeaking();

  try {
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(1.2, Math.max(0.5, options.rate ?? DEFAULT_SPEECH_SETTINGS.rate));
    utterance.pitch = 1.05;
    utterance.lang = document?.documentElement?.lang || "en";
    const finish = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      options.onDone?.();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  try {
    return window.speechSynthesis.speaking;
  } catch {
    return false;
  }
}
