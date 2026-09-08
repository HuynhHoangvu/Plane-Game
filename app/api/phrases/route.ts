import { NextRequest, NextResponse } from "next/server";
import phrasesEn from "@/data/phrases.en.json";
import phrasesDe from "@/data/phrases.de.json";
import type { PhraseData, CEFRLevel } from "@/lib/types";

const PHRASES_BY_LANG: Record<string, PhraseData[]> = {
  en: phrasesEn as PhraseData[],
  de: phrasesDe as PhraseData[],
};

const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") ?? "en";
  const grammarFocus = searchParams.get("grammar_focus");
  const level = searchParams.get("level");

  const phrases = PHRASES_BY_LANG[lang];
  if (!phrases) {
    return NextResponse.json({ error: `Unsupported lang: ${lang}` }, { status: 400 });
  }

  let filtered = phrases;
  if (grammarFocus) filtered = filtered.filter((p) => p.grammar_focus === grammarFocus);
  if (level) {
    // Cho phép cụm từ ở level hiện tại hoặc thấp hơn 1 bậc — tránh Elite quá dễ (vd. A1)
    // xuất hiện khi người chơi đã chọn level cao (vd. B2), nhưng vẫn đủ số lượng cụm từ để random.
    const idx = LEVEL_ORDER.indexOf(level as CEFRLevel);
    if (idx !== -1) {
      const allowed = new Set(LEVEL_ORDER.slice(Math.max(0, idx - 1), idx + 1));
      filtered = filtered.filter((p) => allowed.has(p.level));
    }
  }
  return NextResponse.json(filtered);
}
