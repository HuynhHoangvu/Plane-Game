"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SourceLang } from "@/lib/types";
import { loadProgress } from "@/lib/storage";
import { DEFAULT_CEFR_LEVEL } from "@/lib/languages";

const MAX_START_LEVEL = 50;
const LEVEL_OPTIONS = Array.from({ length: MAX_START_LEVEL }, (_, i) => i + 1);

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

  useEffect(() => {
    // Đọc localStorage sau mount — tránh SSR mismatch (xem CLAUDE.md quy ước localStorage)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc external storage, không phải derived state
    setStartLevel(loadProgress(lang, DEFAULT_CEFR_LEVEL).maxLevel);
  }, [lang]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() =>
          router.push(`/game?lang=${lang}&level=${DEFAULT_CEFR_LEVEL}&startLevel=${startLevel}`)
        }
        className={`rounded-full bg-gradient-to-r ${gradientClass} px-8 py-3 font-semibold text-white shadow-lg ${shadowClass} transition hover:scale-105`}
      >
        {flag} {label}
      </button>
      <label className="flex items-center gap-1 text-xs text-white/50">
        Level
        <select
          value={startLevel}
          onChange={(e) => setStartLevel(Number(e.target.value))}
          className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-white/80"
        >
          {LEVEL_OPTIONS.map((lv) => (
            <option key={lv} value={lv}>
              {lv}
            </option>
          ))}
        </select>
        /{MAX_START_LEVEL}
      </label>
    </div>
  );
}
