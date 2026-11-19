/*
 * Voice for Ask AIDA, using the browser's built-in Web Speech API (no extra service,
 * no extra cost, nothing installed):
 *  - speech-to-text: SpeechRecognition (Chrome, Edge, Safari; not Firefox);
 *  - text-to-speech: speechSynthesis, with whichever voices the visitor's device has.
 *
 * Audio is never recorded or stored by AIDA. Some browsers (e.g. Chrome) send the
 * audio to their own speech service to turn it into text.
 */

export type VoiceLang = "en-US" | "ur-PK";
export type ReplyLanguageLike = "en" | "roman" | "urdu";

/** Microphone language for the chat's current language (spoken Urdu and Roman Urdu are both Urdu speech). */
export function voiceLangFor(lang: ReplyLanguageLike): VoiceLang {
  return lang === "en" ? "en-US" : "ur-PK";
}

const URDU_SCRIPT = /[؀-ۿ]/;

/**
 * The part of an answer worth reading aloud: without page links and "More details"
 * lines, web addresses or markdown, and with phone numbers read digit by digit.
 */
export function textForSpeech(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*(More details|Mazeed maloomat|مزید معلومات)\s*:/i.test(line))
    .join(" ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/(^|\s)\/[a-z-]+(?:\/[a-z0-9-]+)?(?:#[a-z-]+)?(?=[\s.,;:!?)]|$)/gi, " ")
    .replace(/[*_`#>|]/g, " ")
    .replace(/\+?\d[\d\s]{8,}\d/g, (num) => num.replace(/\s+/g, "").split("").join(" "))
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

interface VoiceLike {
  lang: string;
  name: string;
  localService?: boolean;
}

/**
 * Picks a device voice for the text. Urdu script needs an Urdu voice; Roman Urdu reads
 * acceptably with a South Asian English or Hindi voice; English uses an English voice.
 * Returns null when the device has no suitable voice (e.g. no Urdu voice installed).
 */
export function pickVoice<V extends VoiceLike>(voices: V[], text: string): V | null {
  const by = (prefix: string) => voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
  if (URDU_SCRIPT.test(text)) return by("ur") ?? null;
  const romanUrdu = /\b(hai|hain|aap|kya|ki|ke|ka|mein|nahi|hoti|karein|sakte)\b/i.test(text);
  if (romanUrdu) return by("en-in") ?? by("hi") ?? by("en-gb") ?? by("en") ?? null;
  return by("en-gb") ?? by("en-us") ?? by("en") ?? null;
}

/** The browser's speech-recognition constructor, or null where it isn't available (e.g. Firefox). */
export function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** Minimal shape of the Web Speech recognition object we rely on. */
export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/** Plain-language messages for speech-recognition errors. */
export function voiceErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Please allow the microphone for this website in your browser settings, then try again.";
    case "no-speech":
      return "I didn't hear anything. Tap the microphone and speak clearly, close to your device.";
    case "audio-capture":
      return "No microphone was found. Please connect or enable a microphone and try again.";
    case "network":
      return "Voice input needs an internet connection. Please check your connection and try again.";
    case "language-not-supported":
      return "This browser can't recognise speech in the selected language. Try switching EN / اردو or typing your question.";
    case "aborted":
      return "";
    default:
      return "Voice input didn't work this time. Please try again or type your question.";
  }
}

/**
 * Splits text into sentence-sized pieces (some browsers stop reading long utterances
 * part-way through, so each piece is spoken separately).
 */
export function speechChunks(text: string, max = 180): string[] {
  const sentences = text.match(/[^.!?؟۔]+[.!?؟۔]*/g) ?? [text];
  const chunks: string[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    const last = chunks[chunks.length - 1];
    if (last && last.length + s.length + 1 <= max) chunks[chunks.length - 1] = `${last} ${s}`;
    else chunks.push(s);
  }
  return chunks;
}

/** The device's voices; some browsers (e.g. Chrome) load them a moment after the page. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", done);
    setTimeout(done, 1500);
  });
}

/** Speaks the text with a suitable device voice. Resolves false when no suitable voice exists. */
export async function speak(text: string, onEnd?: () => void): Promise<boolean> {
  if (!canSpeak()) return false;
  const spoken = textForSpeech(text);
  if (!spoken) return false;
  const synth = window.speechSynthesis;
  const voice = pickVoice(await loadVoices(), spoken);
  if (!voice) return false;
  synth.cancel();
  const chunks = speechChunks(spoken);
  chunks.forEach((chunk, i) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.98;
    if (i === chunks.length - 1) utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    synth.speak(utterance);
  });
  return true;
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}
