export type SourceLang = "en" | "de";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Translation = Record<string, string>; // { vi: "...", es: "..." }

export interface WordData {
  id: string;
  source_lang: SourceLang;
  word: string;
  translations: Translation;
  topic: string;
  level: CEFRLevel;
}

export interface PhraseData {
  id: string;
  source_lang: SourceLang;
  text: string;
  translations: Translation;
  grammar_focus: string;
  level: CEFRLevel;
}

export interface BossData {
  boss_id: string;
  source_lang: SourceLang;
  grammar_focus: string;
  text: string;
  translations: Translation;
  time_limit_seconds: number;
  base_score: number;
}
