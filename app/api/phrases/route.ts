import { NextRequest, NextResponse } from "next/server";
import phrasesEn from "@/data/phrases.en.json";
import phrasesDe from "@/data/phrases.de.json";
import type { PhraseData } from "@/lib/types";

const PHRASES_BY_LANG: Record<string, PhraseData[]> = {
  en: phrasesEn as PhraseData[],
  de: phrasesDe as PhraseData[],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") ?? "en";
  const grammarFocus = searchParams.get("grammar_focus");

  const phrases = PHRASES_BY_LANG[lang];
  if (!phrases) {
    return NextResponse.json({ error: `Unsupported lang: ${lang}` }, { status: 400 });
  }

  const filtered = grammarFocus
    ? phrases.filter((p) => p.grammar_focus === grammarFocus)
    : phrases;
  return NextResponse.json(filtered);
}
