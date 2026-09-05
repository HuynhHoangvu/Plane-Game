import type { SourceLang, CEFRLevel } from "./types";

export interface ProgressRecord {
  highScore: number;
  maxLevel: number;
}

export interface LeaderboardEntry {
  score: number;
  lang: SourceLang;
  level: CEFRLevel;
  date: string;
}

const MUTE_KEY = "td-muted";
const LEADERBOARD_KEY = "td-leaderboard";

function progressKey(lang: SourceLang, level: CEFRLevel): string {
  return `td-progress-${lang}-${level}`;
}

export function loadProgress(lang: SourceLang, level: CEFRLevel): ProgressRecord {
  if (typeof window === "undefined") return { highScore: 0, maxLevel: 1 };
  try {
    const raw = window.localStorage.getItem(progressKey(lang, level));
    if (!raw) return { highScore: 0, maxLevel: 1 };
    const parsed = JSON.parse(raw);
    return {
      highScore: typeof parsed.highScore === "number" ? parsed.highScore : 0,
      maxLevel: typeof parsed.maxLevel === "number" ? parsed.maxLevel : 1,
    };
  } catch {
    return { highScore: 0, maxLevel: 1 };
  }
}

export function saveProgress(lang: SourceLang, level: CEFRLevel, record: ProgressRecord): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadProgress(lang, level);
    const merged: ProgressRecord = {
      highScore: Math.max(current.highScore, record.highScore),
      maxLevel: Math.max(current.maxLevel, record.maxLevel),
    };
    window.localStorage.setItem(progressKey(lang, level), JSON.stringify(merged));
  } catch {
    // localStorage unavailable — ignore
  }
}

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadLeaderboard();
    const next = [...current, entry].sort((a, b) => b.score - a.score).slice(0, 10);
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
