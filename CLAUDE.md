@AGENTS.md

# Typing Defender — Project Context

Game luyện gõ phím kết hợp học từ vựng/ngữ pháp tiếng Anh & tiếng Đức, dịch nghĩa tiếng Việt. Từ vựng/cụm từ/đoạn văn rơi từ trên xuống, người chơi gõ đúng ký tự để bắn hạ trước khi chạm vạch đáy.

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS 4.
- Không dùng game engine ngoài — toàn bộ vẽ bằng Canvas 2D API trong một component client (`components/game/GameCanvas.tsx`), UI xung quanh (HUD, overlay) là DOM/Tailwind chồng lên canvas.
- Dữ liệu từ vựng/ngữ pháp lưu dạng JSON trong `data/`, serve qua Next.js API Routes (`app/api/*/route.ts`) — không có database, không có backend riêng.
- Không có đăng nhập/backend lưu trữ — tiến trình/leaderboard lưu hoàn toàn bằng `localStorage` (`lib/storage.ts`), riêng theo từng trình duyệt.

## Cấu trúc thư mục
```
app/
  page.tsx              - Trang chủ, link nhanh sang /game?lang=&level=A1, link Settings + Leaderboard
  settings/page.tsx      - Chọn Cấp độ CEFR (A1-C2) + Tốc độ rơi (slow/normal/fast/veryfast) + Chế độ (normal/recall), rồi chọn ngôn ngữ
  game/page.tsx          - Đọc query lang/level/speed/mode, render <GameCanvas>
  leaderboard/page.tsx    - Client component, đọc top 10 điểm từ localStorage (lib/storage.ts)
  api/words/route.ts     - GET ?lang=en|de&level=A1..C2&topic= -> WordData[]
  api/phrases/route.ts   - GET ?lang=&grammar_focus= -> PhraseData[]
  api/boss/route.ts      - GET ?lang=&boss_id= -> BossData[]
components/game/
  GameCanvas.tsx          - TOÀN BỘ game loop (spawn, fall, typing, particles, projectiles, boss, SFX, mute, lưu progress) nằm ở đây
components/ui/
  HeaderBar.tsx, DeadlineLine.tsx, BossPanel.tsx
lib/
  types.ts                - WordData, PhraseData, BossData, CEFRLevel, SourceLang
  languages.ts            - danh sách ngôn ngữ hỗ trợ, CEFR level, FALL_SPEED_OPTIONS
  storage.ts              - đọc/ghi localStorage: loadProgress/saveProgress (high score + max level theo lang+CEFR), loadMuted/saveMuted, loadLeaderboard/addLeaderboardEntry (top 10)
  game/types.ts            - FallingEntity, GameConfig, BossState (runtime types)
  game/spawnSystem.ts       - vị trí spawn chống đè, spawn rate/max active/base speed theo level (nhận thêm speedMultiplier)
  game/typingSystem.ts      - logic lock target + so khớp ký tự (processKeyPress)
  game/recallSystem.ts      - buildHint() cho Active Recall Mode
  game/audio.ts             - SFX tổng hợp bằng Web Audio API (oscillator): playCorrectBeep/playErrorBeep/playExplosion/playWarning, không dùng file âm thanh ngoài
data/
  words.en.json, words.de.json     - 540 từ EN / 520 từ DE, phủ 6 cấp CEFR (A1-C2), import từ file Excel user cung cấp (TypingDefender_Vocab_*_Mega.xlsx), có sẵn nghĩa tiếng Việt
  phrases.en.json, phrases.de.json - 18 cụm từ/câu mỗi ngôn ngữ, phủ ~18 cấu trúc ngữ pháp khác nhau (thì cơ bản, conditional 1-3, passive, modal, reported speech) cho quái Elite
  boss.en.json, boss.de.json       - 4 đoạn văn/ngôn ngữ, mỗi đoạn 1 `grammar_focus` khác nhau, chọn ngẫu nhiên mỗi lần Boss xuất hiện (không lặp lại đoạn vừa đánh)
```

## Cơ chế gameplay đã có
- **Minion**: từ đơn rơi, gõ đúng ký tự đầu để "khóa" mục tiêu (`processKeyPress` trong `typingSystem.ts`), gõ tiếp các ký tự sau, xong thì nổ + cộng điểm.
- **Elite**: cứ đúng con thứ 5 trong số quái spawn ra (`spawnCountRef.current % 5 === 0`) là Elite — cụm từ/câu ngắn (`phrases.*.json`), rơi chậm hơn Minion ~40%, khi hạ gục hiện nghĩa tiếng Việt bay lên (floating text).
- **Boss**: xuất hiện mỗi 20 lần spawn (`spawnCountRef.current % 20 === 0`), chọn ngẫu nhiên 1 boss khác với boss vừa đánh trong `bossList` (tránh lặp lại `grammar_focus`) — không rơi, hiển thị cố định qua `BossPanel`, có time bar đếm ngược; gõ hết đoạn văn → đọc to bằng giọng đọc, pause + reveal bản dịch (typewriter-style) + nút tiếp tục, tăng `level` và lưu `maxLevel` vào localStorage.
- **Active Recall Mode**: chế độ chơi riêng, chọn ở Settings (`?mode=recall`) — TOÀN BỘ Minion (trừ Elite) ẩn từ gốc, chỉ hiện gợi ý dạng `d _ _ _ _` (ký tự đầu + gạch dưới) và nghĩa tiếng Việt phía trên. Mode `normal` (mặc định) không còn trộn ngẫu nhiên recall vào nữa (khác thiết kế v1: trước đây recall tự trộn vào Normal Mode từ level ≥ 5, giờ đã tách bạch 2 mode).
- **Phi thuyền phòng thủ**: hình tam giác neon vẽ cố định giữa đáy canvas (constants `PLANE_X`/`PLANE_Y`). Mỗi lần gõ đúng ký tự sẽ bắn một `Projectile` bay lên nhắm vào từ đang gõ (bám tọa độ động), khi mọi loại từ (Minion/Elite/Recall) nổ hoàn toàn đều hiện nghĩa tiếng Việt bay lên + đọc to bằng giọng đọc (Web Speech API, `en-US`/`de-DE` tùy `sourceLang`).
- **CEFR level**: `WordData.level` (`A1`-`C2`), lọc qua `/api/words?level=`, chọn ở trang Settings, hiển thị trên HeaderBar dưới nhãn "CEFR".
- **Tốc độ rơi**: chọn ở Settings (`FALL_SPEED_OPTIONS` trong `lib/languages.ts`: slow 0.55x / normal 0.8x mặc định / fast 1.05x / veryfast 1.35x), nhân vào `baseSpeedForLevel()`.
- **SFX + Mute**: `lib/game/audio.ts` phát beep tổng hợp cho gõ đúng/sai/nổ/cảnh báo gần vạch đỏ (throttle 900ms giữa các lần cảnh báo qua `lastWarningRef`). Nút 🔊/🔇 trên HeaderBar bật/tắt cả SFX lẫn giọng đọc, lưu trạng thái qua `lib/storage.ts` (`loadMuted`/`saveMuted`).
- **Lưu tiến trình + Leaderboard**: high score/max level lưu riêng theo từng cặp `(sourceLang, cefrLevel)` (`td-progress-{lang}-{level}` trong localStorage). Game Over hiển thị "Kỷ lục" và ghi 1 entry vào leaderboard top-10 (`td-leaderboard`), xem tại `/leaderboard`.

## Quy ước quan trọng khi sửa code
- `GameCanvas.tsx` dùng nhiều `useRef` để tránh re-render trong vòng lặp `requestAnimationFrame` (60fps) — KHÔNG gán trực tiếp vào `.current` trong thân render (React lint sẽ báo lỗi "Cannot access refs during render"), luôn set ref trong `useEffect` hoặc trong callback/event handler. Đặc biệt: bất cứ state nào cần đọc giá trị "hiện tại" bên trong closure của `tick()` (chạy trong `requestAnimationFrame`, không re-tạo mỗi render) đều cần một ref đồng bộ riêng (xem `scoreRef`, `levelRef`, `bossListRef`, `mutedRef`...).
- Khi vẽ text trên canvas, dùng `ctx.measureText(text.slice(0, i)).width` để tính vị trí từng ký tự — KHÔNG cộng thêm khoảng trắng thủ công (từng gây bug tách chữ đầu ra riêng).
- Spawn/fall logic (spawn mới, rơi, mất HP) phải tạm dừng khi `bossActiveRef.current === true`, nhưng particles/projectiles/vẽ máy bay vẫn phải chạy để hoạt ảnh không bị đứng hình trong lúc đánh Boss.
- Umlaut tiếng Đức (ä/ö/ü/ß) được viết thành ASCII (ae/oe/ue/ss) trong toàn bộ `data/*.de.json` (words/phrases/boss) để tránh phức tạp khi gõ trên bàn phím thường.
- Đọc `localStorage` (progress, mute, leaderboard) chỉ được thực hiện trong `useEffect` sau mount (tránh SSR mismatch vì các trang liên quan là Server Component ở tầng cha). ESLint rule `react-hooks/set-state-in-effect` sẽ báo lỗi khi gọi `setState` trực tiếp trong effect kiểu này — đây là false positive hợp lệ cho pattern đọc external storage, đã `eslint-disable-next-line` kèm comment giải thích tại các vị trí này (xem `GameCanvas.tsx`, `app/leaderboard/page.tsx`) — giữ nguyên cách xử lý này khi thêm chỗ đọc localStorage mới, đừng cố "sửa" bằng cách bỏ effect.
- Sau mỗi thay đổi trong `components/game/`, `app/` hoặc `lib/`, chạy `npx tsc --noEmit` và `npx eslint .` trước khi coi là xong — dự án yêu cầu sạch lỗi cả hai.

## Việc còn thiếu / có thể mở rộng thêm
- Chưa test trên trình duyệt thật với người dùng thật, chỉ mới kiểm tra qua `curl`/`tsc`/`eslint` — nên tự chơi thử để bắt các vấn đề UX (cân bằng độ khó, giọng đọc trên các trình duyệt khác nhau...).
- SFX hiện chỉ có beep tổng hợp đơn giản (không phải file âm thanh thu sẵn) — nếu cần âm thanh chân thực hơn (tiếng click bàn phím cơ, tiếng nổ thật...) sẽ cần thay bằng file audio.
- Leaderboard chỉ local theo từng trình duyệt (không đồng bộ đa thiết bị) — muốn làm leaderboard toàn cầu cần backend + database thật.
- Trang Settings chưa hiển thị high score/kỷ lục hiện tại của từng lựa chọn (mới chỉ hiển thị ở màn Game Over) — có thể bổ sung một client component nhỏ đọc `loadProgress()` để hiện ngay trên nút chọn Cấp độ.
- Data `phrases.*.json`/`boss.*.json` vẫn có thể mở rộng thêm nữa nếu muốn phủ nhiều cấu trúc ngữ pháp hơn (hiện đã có ~18 phrase + 4 boss/ngôn ngữ, đủ đa dạng cơ bản nhưng chưa đầy đủ mọi thì/cấu trúc).
