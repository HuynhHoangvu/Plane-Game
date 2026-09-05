import { NextRequest, NextResponse } from "next/server";
import wordsEn from "@/data/words.en.json";
import wordsDe from "@/data/words.de.json";
import type { WordData } from "@/lib/types";

const WORDS_BY_LANG: Record<string, WordData[]> = {
  en: wordsEn as WordData[],
  de: wordsDe as WordData[],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") ?? "en";
  const topic = searchParams.get("topic");
  const level = searchParams.get("level");

  const words = WORDS_BY_LANG[lang];
  if (!words) {
    return NextResponse.json({ error: `Unsupported lang: ${lang}` }, { status: 400 });
  }

  let filtered = words;
  if (topic) filtered = filtered.filter((w) => w.topic === topic);
  if (level) filtered = filtered.filter((w) => w.level === level);
  return NextResponse.json(filtered);
}
