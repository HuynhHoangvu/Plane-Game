import Link from "next/link";
import type { CEFRLevel } from "@/lib/types";
import {
  SOURCE_LANGUAGES,
  CEFR_LEVELS,
  DEFAULT_CEFR_LEVEL,
  FALL_SPEED_OPTIONS,
  DEFAULT_FALL_SPEED,
} from "@/lib/languages";
import LanguageButton from "@/components/ui/LanguageButton";
import PersistSettings from "@/components/ui/PersistSettings";

const GAME_MODES = [
  { code: "normal", label: "Bình thường", hint: "Từ hiển thị rõ ràng" },
  { code: "recall", label: "Ghi nhớ chủ động", hint: "Ẩn từ, chỉ hiện nghĩa + gợi ý" },
];

interface SettingsPageProps {
  searchParams: Promise<{ level?: string; speed?: string; mode?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const selectedLevel = params.level ?? DEFAULT_CEFR_LEVEL;
  const selectedSpeed = FALL_SPEED_OPTIONS.some((s) => s.code === params.speed)
    ? (params.speed as string)
    : DEFAULT_FALL_SPEED;
  const selectedMode = GAME_MODES.some((m) => m.code === params.mode) ? (params.mode as string) : "normal";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#020617] px-6 py-16 text-center">
      <PersistSettings
        level={selectedLevel as CEFRLevel}
        speed={selectedSpeed}
        mode={selectedMode as "normal" | "recall"}
      />
      <div>
        <h1 className="text-3xl font-bold text-white">Cài đặt</h1>
        <p className="mt-2 max-w-sm text-white/50">
          Chọn cấp độ từ vựng (theo khung CEFR), tốc độ rơi và chế độ chơi, rồi chọn ngôn ngữ để bắt đầu chơi. Ngôn ngữ dịch mặc định là Tiếng Việt.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/40">Cấp độ</span>
        <div className="flex flex-wrap justify-center gap-2">
          {CEFR_LEVELS.map((lvl) => (
            <Link
              key={lvl.code}
              href={`/settings?level=${lvl.code}&speed=${selectedSpeed}&mode=${selectedMode}`}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                lvl.code === selectedLevel
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {lvl.label}
              <div className="text-[10px] font-normal text-white/40">{lvl.hint}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/40">Tốc độ rơi</span>
        <div className="flex flex-wrap justify-center gap-2">
          {FALL_SPEED_OPTIONS.map((s) => (
            <Link
              key={s.code}
              href={`/settings?level=${selectedLevel}&speed=${s.code}&mode=${selectedMode}`}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                s.code === selectedSpeed
                  ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/40">Chế độ</span>
        <div className="flex flex-wrap justify-center gap-2">
          {GAME_MODES.map((m) => (
            <Link
              key={m.code}
              href={`/settings?level=${selectedLevel}&speed=${selectedSpeed}&mode=${m.code}`}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                m.code === selectedMode
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {m.label}
              <div className="text-[10px] font-normal text-white/40">{m.hint}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/40">Ngôn ngữ</span>
        <div className="flex gap-4">
          {SOURCE_LANGUAGES.map((l) => (
            <LanguageButton
              key={l.code}
              code={l.code}
              flag={l.flag}
              label={l.label}
              href={`/game?lang=${l.code}&level=${selectedLevel}&speed=${selectedSpeed}&mode=${selectedMode}`}
              cefrLevel={selectedLevel as CEFRLevel}
            />
          ))}
        </div>
      </div>

      <Link href="/" className="mt-2 text-sm text-white/40 underline underline-offset-4 hover:text-white/70">
        ← Về trang chủ
      </Link>
    </div>
  );
}
