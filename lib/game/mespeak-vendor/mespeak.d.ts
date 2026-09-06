interface MeSpeakOptions {
  amplitude?: number;
  pitch?: number;
  speed?: number;
  wordgap?: number;
  variant?: string;
  voice?: string;
}

interface MeSpeakModule {
  loadConfig(data: unknown): void;
  loadVoice(data: unknown): void;
  setDefaultVoice(voiceId: string): void;
  isConfigLoaded(): boolean;
  isVoiceLoaded(voiceId: string): boolean;
  speak(text: string, options?: MeSpeakOptions, callback?: (success: boolean) => void): number;
}

declare const meSpeak: MeSpeakModule;
export = meSpeak;
