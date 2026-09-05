import type { BossData } from "@/lib/types";

interface BossPanelProps {
  boss: BossData;
  typedLength: number;
  timeLeft: number;
  totalTime: number;
}

export default function BossPanel({ boss, typedLength, timeLeft, totalTime }: BossPanelProps) {
  const progress = Math.max(0, timeLeft / totalTime);

  return (
    <div className="absolute inset-x-6 top-10 rounded-2xl border border-fuchsia-500/40 bg-black/80 p-6 shadow-2xl shadow-fuchsia-900/40 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-fuchsia-400">
          Boss · {boss.grammar_focus}
        </span>
        <span className="text-white/60">{Math.ceil(timeLeft)}s</span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-lg leading-relaxed">
        {boss.text.split("").map((ch, i) => (
          <span key={i} className={i < typedLength ? "text-emerald-400" : "text-white/90"}>
            {ch}
          </span>
        ))}
      </p>
    </div>
  );
}
