"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SourceLang, CEFRLevel } from "@/lib/types";
import { loadProgress, loadLastSettings } from "@/lib/storage";
import { DEFAULT_CEFR_LEVEL, DEFAULT_FALL_SPEED } from "@/lib/languages";

const MAX_START_LEVEL = 50;

interface QuickPlayButtonProps {
  lang: SourceLang;
  flag: string;
  label: string;
  gradientClass: string;
  shadowClass: string;
}

export default function QuickPlayButton({
  lang,
  flag,
  label,
  gradientClass,
  shadowClass,
}: QuickPlayButtonProps) {
  const router = useRouter();
  const [startLevel, setStartLevel] = useState(1);
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>(DEFAULT_CEFR_LEVEL);
  const [speed, setSpeed] = useState(DEFAULT_FALL_SPEED);
  const [mode, setMode] = useState<"normal" | "recall">("normal");

  useEffect(() => {
    // Đọc localStorage sau mount — tránh SSR mismatch (xem CLAUDE.md quy ước localStorage)
    const last = loadLastSettings();
    const level = last?.level ?? DEFAULT_CEFR_LEVEL;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc external storage, không phải derived state
    setCefrLevel(level);
    setSpeed(last?.speed ?? DEFAULT_FALL_SPEED);
    setMode(last?.mode ?? "normal");
    setStartLevel(loadProgress(lang, level).maxLevel);
  }, [lang]);

  const clamp = (n: number) => Math.min(MAX_START_LEVEL, Math.max(1, n));

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() =>
          router.push(`/game?lang=${lang}&level=${cefrLevel}&speed=${speed}&mode=${mode}&startLevel=${startLevel}`)
        }
        className={`rounded-full bg-gradient-to-r ${gradientClass} px-8 py-3 font-semibold text-white shadow-lg ${shadowClass} transition hover:scale-105`}
      >
        {flag} {label}
      </button>
      <span className="text-[11px] text-white/40">Cấp độ: {cefrLevel}</span>
      <label className="flex items-center gap-1.5 text-xs text-white/50">
        Level
        <button
          type="button"
          onClick={() => setStartLevel((n) => clamp(n - 1))}
          className="flex h-6 w-6 items-center justify-center rounded border border-white/15 bg-black/40 text-white/80 transition hover:bg-white/10"
          aria-label="Giảm level"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={MAX_START_LEVEL}
          value={startLevel}
          onChange={(e) => setStartLevel(clamp(Number(e.target.value) || 1))}
          className="w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-center text-white/80 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => setStartLevel((n) => clamp(n + 1))}
          className="flex h-6 w-6 items-center justify-center rounded border border-white/15 bg-black/40 text-white/80 transition hover:bg-white/10"
          aria-label="Tăng level"
        >
          +
        </button>
        /{MAX_START_LEVEL}
      </label>
    </div>
  );
}
