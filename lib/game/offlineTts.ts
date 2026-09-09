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

function speakWithMeSpeak(text: string, lang: SourceLang): Promise<void> {
  return ensureReady(lang)
    .then((meSpeak) => {
      meSpeak.speak(text, { amplitude: 100, pitch: 50, speed: 155 });
    })
    .catch(() => {
      // offline TTS unavailable — fail silently, gameplay is unaffected
    });
}

// --- Web Speech API: giọng thật của hệ điều hành/trình duyệt, nghe tự nhiên hơn
// nhiều so với mespeak (formant synthesis). Chỉ dùng khi máy THỰC SỰ có voice
// đúng ngôn ngữ cài sẵn — nếu không, browser sẽ âm thầm fallback sang giọng
// tiếng Anh mặc định mà không báo lỗi (lý do ban đầu dự án bỏ Web Speech API,
// xem CLAUDE.md). Nên luôn verify voice.lang khớp trước khi dùng, tránh lặp bug cũ.
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadWebSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);
  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish, { once: true });
    // một số trình duyệt (đặc biệt mobile) không bao giờ bắn voiceschanged
    setTimeout(finish, 1000);
  });
  return voicesReadyPromise;
}

async function findWebSpeechVoice(lang: SourceLang): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadWebSpeechVoices();
  const prefix = lang.toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

export function primeOfflineTts(lang: SourceLang) {
  loadWebSpeechVoices().catch(() => {
    // ignore
  });
  ensureReady(lang).catch(() => {
    // silently ignore — speakOffline will retry on next call
  });
}

export async function speakOffline(text: string, lang: SourceLang): Promise<void> {
  const voice = await findWebSpeechVoice(lang).catch(() => null);
  if (voice) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // rơi xuống mespeak nếu Web Speech API lỗi bất ngờ
    }
  }
  await speakWithMeSpeak(text, lang);
}
