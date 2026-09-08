import GameCanvas from "@/components/game/GameCanvas";
import type { SourceLang, CEFRLevel } from "@/lib/types";
import {
  DEFAULT_SOURCE_LANG,
  DEFAULT_CEFR_LEVEL,
  CEFR_LEVELS,
  FALL_SPEED_OPTIONS,
  DEFAULT_FALL_SPEED,
} from "@/lib/languages";

const MAX_START_LEVEL = 50;

interface GamePageProps {
  searchParams: Promise<{
    lang?: string;
    level?: string;
    speed?: string;
    mode?: string;
    startLevel?: string;
  }>;
}

export default async function GamePage({ searchParams }: GamePageProps) {
  const params = await searchParams;
  const lang: SourceLang = params.lang === "de" ? "de" : DEFAULT_SOURCE_LANG;
  const level: CEFRLevel = CEFR_LEVELS.some((l) => l.code === params.level)
    ? (params.level as CEFRLevel)
    : DEFAULT_CEFR_LEVEL;
  const speedCode = FALL_SPEED_OPTIONS.some((s) => s.code === params.speed)
    ? params.speed!
    : DEFAULT_FALL_SPEED;
  const speedMultiplier =
    FALL_SPEED_OPTIONS.find((s) => s.code === speedCode)?.multiplier ?? 0.8;
  const gameMode: "normal" | "recall" = params.mode === "recall" ? "recall" : "normal";
  const parsedStartLevel = Number(params.startLevel);
  const startLevel =
    Number.isInteger(parsedStartLevel) && parsedStartLevel >= 1 && parsedStartLevel <= MAX_START_LEVEL
      ? parsedStartLevel
      : 1;

  return (
    <div className="flex flex-1 items-center justify-center bg-[#020617] px-4 py-8">
      <GameCanvas
        sourceLang={lang}
        cefrLevel={level}
        fallSpeedMultiplier={speedMultiplier}
        gameMode={gameMode}
        startLevel={startLevel}
      />
    </div>
  );
}
