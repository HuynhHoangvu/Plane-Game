import type { SourceLang, CEFRLevel } from "./types";

export interface LanguageOption {
  code: SourceLang;
  label: string;
  flag: string;
}

export const SOURCE_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const DEFAULT_SOURCE_LANG: SourceLang = "en";
export const DEFAULT_TARGET_LANG = "vi";

export interface CEFROption {
  code: CEFRLevel;
  label: string;
  hint: string;
}

export const CEFR_LEVELS: CEFROption[] = [
  { code: "A1", label: "A1", hint: "Mới bắt đầu" },
  { code: "A2", label: "A2", hint: "Sơ cấp" },
  { code: "B1", label: "B1", hint: "Trung cấp" },
  { code: "B2", label: "B2", hint: "Trung cao cấp" },
  { code: "C1", label: "C1", hint: "Cao cấp" },
  { code: "C2", label: "C2", hint: "Thành thạo" },
];

export const DEFAULT_CEFR_LEVEL: CEFRLevel = "A1";

export interface FallSpeedOption {
  code: string;
  label: string;
  multiplier: number;
}

export const FALL_SPEED_OPTIONS: FallSpeedOption[] = [
  { code: "slow", label: "Chậm", multiplier: 0.55 },
  { code: "normal", label: "Vừa", multiplier: 0.8 },
  { code: "fast", label: "Nhanh", multiplier: 1.05 },
  { code: "veryfast", label: "Rất nhanh", multiplier: 1.35 },
];

export const DEFAULT_FALL_SPEED = "normal";
