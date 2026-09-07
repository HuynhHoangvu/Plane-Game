import Link from "next/link";

interface HeaderBarProps {
  level: number;
  topic: string;
  score: number;
  combo: number;
  hp: number;
  maxHp: number;
  bossSpawnsIn: number;
  paused: boolean;
  onTogglePause: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function HeaderBar({
  level,
  topic,
  score,
  combo,
  hp,
  maxHp,
  bossSpawnsIn,
  paused,
  onTogglePause,
  muted,
  onToggleMute,
}: HeaderBarProps) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
      <div className="flex flex-col">
        <span className="text-xs font-medium text-cyan-300">Level {level}/20</span>
        <span className="text-[11px] text-white/50">CEFR: {topic}</span>
        {bossSpawnsIn > 0 && bossSpawnsIn <= 3 && (
          <span
            className={`mt-1 text-[11px] font-semibold ${
              bossSpawnsIn === 1
                ? "animate-pulse text-rose-400"
                : bossSpawnsIn === 2
                  ? "animate-pulse text-amber-400"
                  : "text-amber-300"
            }`}
          >
            ⚡ Boss in {bossSpawnsIn}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-white tabular-nums">Score: {score}</span>
        <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 transition-all"
            style={{ width: `${Math.min(100, combo * 8)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: maxHp }).map((_, i) => (
            <span key={i} className={i < hp ? "text-rose-500" : "text-white/15"}>
              ♥
            </span>
          ))}
        </div>
        <button
          onClick={onToggleMute}
          className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/10"
          title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          onClick={onTogglePause}
          className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/10"
        >
          {paused ? "▶" : "❚❚"}
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-rose-500/20 hover:text-rose-300"
          title="Thoát về trang chủ"
        >
          ✕
        </Link>
      </div>
    </div>
  );
}
