import type { SourceLang } from "@/lib/types";

const VOICE_URL: Record<SourceLang, string> = {
  en: "/mespeak/en.json",
  de: "/mespeak/de.json",
};

const VOICE_ID: Record<SourceLang, string> = {
  en: "en/en",
  de: "de",
};

type MeSpeakModule = typeof import("./mespeak-vendor/mespeak");

let meSpeakPromise: Promise<MeSpeakModule> | null = null;
let configPromise: Promise<void> | null = null;
const voiceLoadPromises: Partial<Record<SourceLang, Promise<void>>> = {};

async function getMeSpeak(): Promise<MeSpeakModule> {
  if (!meSpeakPromise) {
    meSpeakPromise = import("./mespeak-vendor/mespeak").then(
      (mod) => (mod as unknown as { default?: MeSpeakModule }).default ?? mod,
    );
  }
  return meSpeakPromise;
}

async function ensureReady(lang: SourceLang) {
  const meSpeak = await getMeSpeak();

  if (!configPromise) {
    configPromise = fetch("/mespeak/mespeak_config.json")
      .then((r) => r.json())
      .then((data) => meSpeak.loadConfig(data));
  }
  await configPromise;

  if (!voiceLoadPromises[lang]) {
    voiceLoadPromises[lang] = fetch(VOICE_URL[lang])
      .then((r) => r.json())
      .then((data) => meSpeak.loadVoice(data));
  }
  await voiceLoadPromises[lang];
  meSpeak.setDefaultVoice(VOICE_ID[lang]);

  return meSpeak;
}

export function primeOfflineTts(lang: SourceLang) {
  ensureReady(lang).catch(() => {
    // silently ignore — speakOffline will retry on next call
  });
}

export async function speakOffline(text: string, lang: SourceLang): Promise<void> {
  try {
    const meSpeak = await ensureReady(lang);
    meSpeak.speak(text, { amplitude: 100, pitch: 50, speed: 155 });
  } catch {
    // offline TTS unavailable — fail silently, gameplay is unaffected
  }
}
