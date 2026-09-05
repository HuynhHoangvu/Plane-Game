import { NextRequest, NextResponse } from "next/server";
import bossEn from "@/data/boss.en.json";
import bossDe from "@/data/boss.de.json";
import type { BossData } from "@/lib/types";

const BOSS_BY_LANG: Record<string, BossData[]> = {
  en: bossEn as BossData[],
  de: bossDe as BossData[],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") ?? "en";
  const bossId = searchParams.get("boss_id");

  const bosses = BOSS_BY_LANG[lang];
  if (!bosses) {
    return NextResponse.json({ error: `Unsupported lang: ${lang}` }, { status: 400 });
  }

  const result = bossId ? bosses.filter((b) => b.boss_id === bossId) : bosses;
  return NextResponse.json(result);
}
