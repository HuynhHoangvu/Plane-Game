# Typing Defender

Game luyện gõ phím kết hợp học từ vựng/ngữ pháp tiếng Anh & tiếng Đức, dịch nghĩa tiếng Việt. Từ vựng/cụm từ/đoạn văn rơi từ trên xuống, người chơi gõ đúng ký tự để bắn hạ trước khi chạm vạch đáy.

## Chạy dự án (development)

```bash
npm install    # chỉ cần chạy lần đầu hoặc khi package.json đổi
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để chơi.

Các lệnh khác:

```bash
npm run build     # build production
npm run start     # chạy bản build production (phải build trước)
npm run lint      # eslint
npx tsc --noEmit  # kiểm tra type TypeScript (không có script sẵn trong package.json)
```

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- Vẽ game bằng Canvas 2D API, không dùng game engine ngoài
- Dữ liệu từ vựng/ngữ pháp là JSON tĩnh trong `data/`, serve qua API Routes — không có database
- Tiến trình chơi/leaderboard lưu bằng `localStorage`, riêng theo từng trình duyệt

## Tài liệu chi tiết

Xem [CLAUDE.md](CLAUDE.md) để biết cấu trúc thư mục, cơ chế gameplay (Minion/Elite/Boss/Active Recall Mode), quy ước code, và phần TTS offline (mespeak).
