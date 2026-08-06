/**
 * Read-aloud support for ColorQuest Kids.
 *
 * The Web Speech API uses voices exposed by the browser or operating system.
 * A voice may be installed on the device (`localService === true`) or supplied
 * by a remote service. ColorQuest prefers verified local English voices, but it
 * never records audio and never requests microphone access.
 *
 * Every export is safe to call on a platform with no speech support. The module
 * degrades to a silent no-op rather than throwing.
 */

export type SpeechVoicePreference = {
  voiceURI: string;
  name: string;
};

export type SpeechSettings = {
  /** Master switch. When false nothing is ever spoken and buttons are hidden. */
  enabled: boolean;
  /** Parent-selected base rate, 0.5 (very slow) to 1.2 (brisk). */
  rate: number;
  /** Read the main prompt automatically when a screen opens. */
  autoRead: "young" | "always" | "never";
  /** Null/undefined lets ColorQuest choose; otherwise remember the parent's voice. */
  voice?: SpeechVoicePreference | null;
};

export type AgeVoiceProfile = {
  label: string;
  rate: number;
  pitch: number;
};

export const SPEECH_STORAGE_KEY = "colorquest-speech-v2";
const LEGACY_SPEECH_STORAGE_KEY = "colorquest-speech-v1";

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  enabled: true,
  rate: 0.85,
  autoRead: "young",
  voice: null,
};

function validVoicePreference(value: unknown): SpeechVoicePreference | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SpeechVoicePreference>;
  if (typeof candidate.voiceURI !== "string" || typeof candidate.name !== "string") return null;
  if (!candidate.voiceURI.trim() && !candidate.name.trim()) return null;
  return { voiceURI: candidate.voiceURI, name: candidate.name };
}

export function loadSpeechSettings(): SpeechSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SPEECH_SETTINGS };
  try {
    const stored = window.localStorage.getItem(SPEECH_STORAGE_KEY)
      || window.localStorage.getItem(LEGACY_SPEECH_STORAGE_KEY);
    const parsed = JSON.parse(stored || "null") as Partial<SpeechSettings> | null;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SPEECH_SETTINGS };
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SPEECH_SETTINGS.enabled,
      rate: typeof parsed.rate === "number" && parsed.rate >= 0.5 && parsed.rate <= 1.2 ? parsed.rate : DEFAULT_SPEECH_SETTINGS.rate,
      autoRead: parsed.autoRead === "always" || parsed.autoRead === "never" || parsed.autoRead === "young"
        ? parsed.autoRead
        : DEFAULT_SPEECH_SETTINGS.autoRead,
      voice: validVoicePreference(parsed.voice),
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

/** Safely enumerate the voices currently exposed by the browser. */
export function getSpeechVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  try {
    return window.speechSynthesis.getVoices?.() || [];
  } catch {
    return [];
  }
}

export function voicePreferenceFor(voice: SpeechSynthesisVoice): SpeechVoicePreference {
  return { voiceURI: voice.voiceURI || "", name: voice.name || "" };
}

function isEnglishVoice(voice: SpeechSynthesisVoice) {
  return /^en(?:[-_]|$)/i.test(voice.lang || "");
}

function preferredEnglishLocale() {
  if (typeof navigator === "undefined") return "en";
  const match = [navigator.language, ...(navigator.languages || [])].find((language) => /^en(?:[-_]|$)/i.test(language));
  return match || "en";
}

/**
 * Choose the clearest likely voice without pretending voice metadata can prove
 * tone or gender. Installed English voices win. Names such as "Natural" and
 * "Enhanced" are useful quality hints on platforms that expose them.
 * A parent's exact override always wins, including a remote voice they chose.
 */
export function selectSpeechVoice(
  voices: SpeechSynthesisVoice[],
  ageWorld: number,
  preference?: SpeechVoicePreference | null,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  if (preference) {
    const byUri = preference.voiceURI && voices.find((voice) => voice.voiceURI === preference.voiceURI);
    if (byUri) return byUri;
    const byName = preference.name && voices.find((voice) => voice.name === preference.name);
    if (byName) return byName;
  }

  const locale = preferredEnglishLocale().toLowerCase().replace("_", "-");
  const naturalHint = /natural|neural|premium|enhanced|high quality/i;
  const gentleHint = /samantha|ava|aria|jenny|serena|susan|karen|moira|victoria/i;
  const matureHint = /daniel|alex|arthur|david|guy|ryan|samantha|ava|aria|jenny|serena/i;

  return [...voices].sort((first, second) => {
    const score = (voice: SpeechSynthesisVoice) => {
      const lang = (voice.lang || "").toLowerCase().replace("_", "-");
      let total = 0;
      if (isEnglishVoice(voice)) total += 1000;
      if (voice.localService === true) total += 500;
      if (lang === locale) total += 120;
      else if (lang.split("-")[0] === locale.split("-")[0]) total += 60;
      if (voice.default) total += 25;
      if (naturalHint.test(voice.name)) total += 100;
      if (ageWorld <= 1 && gentleHint.test(voice.name)) total += 20;
      if (ageWorld >= 2 && matureHint.test(voice.name)) total += 15;
      return total;
    };
    return score(second) - score(first) || first.name.localeCompare(second.name);
  })[0];
}

/** Should a screen read itself aloud on open, for this child? */
export function shouldAutoRead(settings: SpeechSettings, ageWorld: number): boolean {
  if (!settings.enabled) return false;
  if (settings.autoRead === "never") return false;
  if (settings.autoRead === "always") return true;
  return ageWorld <= 1;
}

/** Age-aware delivery layered on top of the parent's chosen speed. */
export function voiceProfileForAge(settings: SpeechSettings, ageWorld: number): AgeVoiceProfile {
  const safeAge = Math.max(0, Math.min(3, Math.floor(ageWorld)));
  const profiles = [
    { label: "Slow and warm", rateOffset: -0.12, pitch: 1.14 },
    { label: "Warm and steady", rateOffset: -0.06, pitch: 1.07 },
    { label: "Natural", rateOffset: 0, pitch: 1.02 },
    { label: "Mature and natural", rateOffset: 0.03, pitch: 0.98 },
  ] as const;
  const profile = profiles[safeAge];
  return {
    label: profile.label,
    rate: Math.min(1.2, Math.max(0.5, settings.rate + profile.rateOffset)),
    pitch: profile.pitch,
  };
}

/**
 * Fifi is a character voice, not the lesson narrator. A slightly quicker,
 * brighter delivery keeps the guide playful without making older children
 * sound babyish. The device still supplies the actual voice.
 */
export function fifiVoiceProfileForAge(settings: SpeechSettings, ageWorld: number): AgeVoiceProfile {
  const safeAge = Math.max(0, Math.min(3, Math.floor(ageWorld)));
  const base = voiceProfileForAge(settings, safeAge);
  const pitchLift = [0.24, 0.2, 0.14, 0.1][safeAge];
  const rateLift = [0.07, 0.06, 0.03, 0.02][safeAge];
  return {
    label: safeAge <= 1 ? "Playful and bright" : "Bright and curious",
    rate: Math.min(1.2, Math.max(0.5, base.rate + rateLift)),
    pitch: Math.min(1.45, Math.max(0.8, base.pitch + pitchLift)),
  };
}

/** Kept as a small public helper for existing callers and tests. */
export function rateForAge(settings: SpeechSettings, ageWorld: number): number {
  return voiceProfileForAge(settings, ageWorld).rate;
}

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

export function toSpokenText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  for (const [pattern, replacement] of SPOKEN_SYMBOLS) text = text.replace(pattern, replacement);
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{E0020}-\u{E007F}]/gu, " ")
    .replace(/[\u{25A0}-\u{25FF}\u{2660}-\u{2669}]/gu, " ")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[·—–]/g, ", ")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/(^[,\s]+)|([,\s]+$)/g, "")
    .trim();
}

export function joinForSpeech(...parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => toSpokenText(part || ""))
    .filter((part) => part.length > 0)
    .join(". ")
    .replace(/\.\s*\./g, ".");
}

type ActiveSpeech = {
  utterance: SpeechSynthesisUtterance;
  token: number;
  clearTimers: () => void;
};

let activeSpeech: ActiveSpeech | null = null;
let speechToken = 0;

/** Stop anything currently being spoken and invalidate its late callbacks. */
export function stopSpeaking() {
  speechToken += 1;
  activeSpeech?.clearTimers();
  activeSpeech = null;
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* some WebViews throw if synthesis was never started */
  }
}

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
  /** Called only for the current utterance when it finishes or fails. */
  onDone?: () => void;
};

/** Speak text, replacing anything previously being spoken. */
export function speak(raw: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) return false;
  const text = toSpokenText(raw);
  if (!text) return false;

  stopSpeaking();
  const token = ++speechToken;

  try {
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(1.2, Math.max(0.5, options.rate ?? DEFAULT_SPEECH_SETTINGS.rate));
    utterance.pitch = Math.min(1.45, Math.max(0.8, options.pitch ?? 1.02));
    if (options.voice) {
      utterance.voice = options.voice;
      utterance.lang = options.voice.lang;
    } else {
      utterance.lang = typeof document !== "undefined" ? (document.documentElement.lang || "en") : "en";
    }

    let startTimer = 0;
    let finishTimer = 0;
    const clearTimers = () => {
      if (startTimer) window.clearTimeout(startTimer);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
    const finish = () => {
      if (!activeSpeech || activeSpeech.token !== token || activeSpeech.utterance !== utterance) return;
      clearTimers();
      activeSpeech = null;
      options.onDone?.();
    };
    utterance.onstart = () => {
      if (startTimer) window.clearTimeout(startTimer);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    activeSpeech = { utterance, token, clearTimers };

    // A few WebViews accept `speak()` but never start or emit an error. Recover
    // the button if the engine remains entirely idle after a generous delay.
    startTimer = window.setTimeout(() => {
      if (!activeSpeech || activeSpeech.token !== token) return;
      try {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) finish();
      } catch {
        finish();
      }
    }, 1800);
    // Last-resort recovery for an engine that begins but never ends/cancels.
    finishTimer = window.setTimeout(finish, Math.max(30000, Math.min(180000, text.length * 140)));

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    if (activeSpeech?.token === token) {
      activeSpeech.clearTimers();
      activeSpeech = null;
    }
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
