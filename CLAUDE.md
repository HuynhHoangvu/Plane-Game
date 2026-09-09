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
  game/offlineTts.ts        - speakOffline()/primeOfflineTts(): phát âm từ vựng bằng engine TTS offline (mespeak/eSpeak, formant synthesis) thay cho Web Speech API — xem "TTS offline" bên dưới
  game/mespeak-vendor/      - Bản vendor CỦA THƯ VIỆN NGOÀI mespeak (GPL) — KHÔNG lint, KHÔNG sửa tay, xem "TTS offline" bên dưới
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
- **Phi thuyền phòng thủ**: hình tam giác neon vẽ cố định giữa đáy canvas (constants `PLANE_X`/`PLANE_Y`), tự nghiêng nhẹ + giật lùi theo hướng bắn (`planeAngleRef`/`planeRecoilRef`, decay dần mỗi frame). Mỗi lần gõ đúng ký tự sẽ bắn một `Projectile` bay lên nhắm vào từ đang gõ (bám tọa độ động), va chạm nổ hạt sáng. Nhấn **Esc** để hủy khóa mục tiêu hiện tại (reset `typedLength` về 0) nếu lỡ khóa nhầm từ dài — từ đang khóa được vẽ khung viền vàng phát sáng. Khi mọi loại từ (Minion/Elite/Recall) nổ hoàn toàn đều hiện nghĩa tiếng Việt bay lên + đọc to bằng giọng đọc offline (xem mục "TTS offline").
- **CEFR level**: `WordData.level` (`A1`-`C2`), lọc qua `/api/words?level=`, chọn ở trang Settings, hiển thị trên HeaderBar dưới nhãn "CEFR".
- **Tốc độ rơi**: chọn ở Settings (`FALL_SPEED_OPTIONS` trong `lib/languages.ts`: slow 0.55x / normal 0.8x mặc định / fast 1.05x / veryfast 1.35x), nhân vào `baseSpeedForLevel()`.
- **SFX + Mute**: `lib/game/audio.ts` phát beep tổng hợp cho gõ đúng/sai/nổ/cảnh báo gần vạch đỏ (throttle 900ms giữa các lần cảnh báo qua `lastWarningRef`). Nút 🔊/🔇 trên HeaderBar bật/tắt cả SFX lẫn giọng đọc, lưu trạng thái qua `lib/storage.ts` (`loadMuted`/`saveMuted`).
- **Lưu tiến trình + Leaderboard**: high score/max level lưu riêng theo từng cặp `(sourceLang, cefrLevel)` (`td-progress-{lang}-{level}` trong localStorage). Game Over hiển thị "Kỷ lục" và ghi 1 entry vào leaderboard top-10 (`td-leaderboard`), xem tại `/leaderboard`.
- **Boss dễ thở hơn**: `time_limit_seconds` trong JSON chỉ là mức sàn — thời gian thực tế = `max(time_limit_seconds, text.length * 0.55 + 8)` tính trong `triggerBoss()`, nên đoạn văn dài tự động có nhiều thời gian hơn. Khi Boss xuất hiện, mọi Minion/Elite đang rơi dở + projectile bị xóa sạch (tránh đứng hình chồng hình). `spawnCountRef` được +1 ngay khi trigger để tránh Boss tự gọi lại lần nữa ở frame kế tiếp (bug đã gặp: bấm "tiếp tục" xong Boss hiện lại ngay).

## TTS offline (phát âm không phụ thuộc giọng đọc hệ điều hành)
Ban đầu dùng thuần Web Speech API (`speechSynthesis`) nhưng phát hiện: nhiều máy không cài giọng đọc tiếng Đức ở tầng OS, khiến trình duyệt tự fallback sang giọng tiếng Anh mặc định mà không báo lỗi — web app không có quyền "cài" voice mới cho OS, đây là giới hạn cứng của Web Speech API. Giải pháp ban đầu: chuyển hẳn sang engine TTS chạy 100% trong trình duyệt (WASM/asm.js) là `mespeak`, không phụ thuộc voice cài sẵn — nhưng giọng mespeak (formant synthesis) nghe khá robot, người dùng phản hồi "không hay". Giải pháp hiện tại: **hybrid** — ưu tiên Web Speech API nếu máy có sẵn voice đúng ngôn ngữ (verify qua `voice.lang.startsWith(lang)` trước khi dùng, tránh lặp lại bug fallback âm thầm), chỉ rơi xuống mespeak khi không tìm thấy voice phù hợp — vừa có giọng tự nhiên hơn khi có thể, vừa đảm bảo không bao giờ đọc sai ngôn ngữ.
- **Thư viện fallback**: `mespeak` (JS port của eSpeak, formant synthesis — giọng hơi "robot" nhưng nhẹ, luôn đúng ngôn ngữ, chạy offline hoàn toàn sau khi tải trang). **License GPL** — đã được user đồng ý dùng cho dự án cá nhân này; nếu sau này dự án chuyển hướng thương mại/đóng nguồn cần xem lại license này.
- **Vendor thay vì cài qua npm**: file gốc `node_modules/mespeak/src/ESpeak.js` chứa 24 byte không hợp lệ UTF-8 (comment cũ ghi ký tự có dấu bằng Latin-1: À, Ö, ß...) khiến Turbopack (Next 16) crash khi parse (`Reading source code for parsing failed`). Đã vendor 2 file đã làm sạch byte lỗi vào `lib/game/mespeak-vendor/` (`ESpeak.js` + `mespeak.js`, kèm `mespeak.d.ts` tự viết vì package gốc không có type). Package npm `mespeak` đã bị gỡ (`npm uninstall mespeak`) — KHÔNG cài lại và import trực tiếp từ `"mespeak"`, sẽ bị lỗi y hệt.
- `lib/game/mespeak-vendor/**` bị loại khỏi ESLint (xem `eslint.config.mjs`) vì là code vendor, không phải code tự viết — không sửa tay các file này, nếu cần update version phải làm sạch byte lỗi lại từ đầu (xem lịch sử git commit tương ứng để lấy lại script sanitize).
- **Asset**: `public/mespeak/mespeak_config.json` (~560KB, dữ liệu ngữ âm chung), `public/mespeak/en.json`, `public/mespeak/de.json` (voice riêng từng ngôn ngữ) — fetch qua HTTP tại runtime, không bundle vào JS.
- `lib/game/offlineTts.ts`: `primeOfflineTts(lang)` gọi khi vào game để tải trước danh sách Web Speech voices + engine/config/voice mespeak dự phòng (không chặn UI); `speakOffline(text, lang)` mỗi lần gọi tự kiểm tra Web Speech có voice đúng `lang` không (`findWebSpeechVoice`) — có thì dùng `SpeechSynthesisUtterance` (đã `speechSynthesis.cancel()` trước để không chồng câu đọc cũ), không có thì fallback `speakWithMeSpeak`; lỗi ở bất kỳ nhánh nào đều im lặng bỏ qua, không phá gameplay.
- Engine mespeak được code-split qua `import()` động (chunk riêng ~880KB sau khi Turbopack xử lý), chỉ tải khi thực sự cần dùng tới (Web Speech không có voice phù hợp), không nằm trong bundle chính.

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
