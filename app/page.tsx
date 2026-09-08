import Link from "next/link";
import QuickPlayButton from "@/components/ui/QuickPlayButton";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#1e1b4b,transparent_60%),linear-gradient(#020617,#000)] px-6 py-16 text-center">
      <h1 className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
        Typing Defender
      </h1>
      <p className="mt-4 max-w-md text-white/60">
        Luyện gõ phím, học từ vựng và ngữ pháp tiếng Anh &amp; tiếng Đức qua các đợt tấn công của Minion, Elite và Boss.
      </p>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row">
        <QuickPlayButton
          lang="en"
          flag="🇬🇧"
          label="Chơi English"
          gradientClass="from-cyan-500 to-blue-600"
          shadowClass="shadow-cyan-950/50"
        />
        <QuickPlayButton
          lang="de"
          flag="🇩🇪"
          label="Chơi Deutsch"
          gradientClass="from-amber-500 to-rose-600"
          shadowClass="shadow-rose-950/50"
        />
      </div>

      <div className="mt-8 flex gap-4 text-sm text-white/40">
        <Link href="/settings" className="underline underline-offset-4 hover:text-white/70">
          Cài đặt cấp độ (A1–C2)
        </Link>
        <Link href="/leaderboard" className="underline underline-offset-4 hover:text-white/70">
          Bảng xếp hạng
        </Link>
      </div>
    </div>
  );
}
