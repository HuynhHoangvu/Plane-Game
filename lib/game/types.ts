import type { WordData, PhraseData, BossData } from "@/lib/types";

export type EntityKind = "minion" | "elite" | "recall";

export interface FallingEntity {
  id: string;
  kind: EntityKind;
  displayText: string; // the text actually typed against (word or phrase)
  meaningText: string; // translation shown to player
  typedLength: number; // how many chars of displayText matched so far
  x: number;
  y: number;
  speed: number; // px/sec
  createdAt: number;
  width: number; // measured text width, for anti-overlap
  dead: boolean;
  isRecall: boolean; // true = hide displayText, show hint instead
}

export interface GameConfig {
  level: number;
  topic: string;
  sourceLang: "en" | "de";
  targetLang: string;
}

export interface BossState {
  data: BossData;
  typedLength: number;
  timeLeft: number;
  active: boolean;
  defeated: boolean;
}

export interface ContentPools {
  words: WordData[];
  phrases: PhraseData[];
  boss: BossData | null;
}
