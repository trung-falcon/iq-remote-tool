# iq-remote-tools

Web UI để chỉnh Firebase Remote Config cho app **brain-training** (project `flab---brain-training`) — không cần viết JSON tay.

**V1:** quản lý phần Native Fullscreen Ad — 3 keys:

| Key | Mô tả |
|---|---|
| `fullscreen_native_timeout` | Số giây trước khi hiện nút thoát |
| `fullscreen_native_close_config` | Flow đóng ad 2 giai đoạn (pre-close mode weights + delays) |
| `fullscreen_native_layout_weights` | Trọng số chọn layout theo event |

## Setup

1. **Lấy service account key** (chỉ làm 1 lần):
   - Firebase Console → ⚙️ Project Settings → tab **Service accounts**
   - Bấm **Generate new private key** → tải file JSON về
   - Lưu thành `service-account.json` ở thư mục gốc repo này (đã gitignore, KHÔNG commit)

2. **Cài đặt & chạy:**

```powershell
yarn
yarn dev
```

- API server: http://localhost:4000
- Web UI: http://localhost:5173 (mở trình duyệt vào đây)

## Mật khẩu truy cập

Tool được bảo vệ bằng **một mật khẩu dùng chung**. Khi mở web, nhập mật khẩu là dùng được — gửi mật khẩu cho ai cần dùng là xong.

- Mật khẩu mặc định: `Falcon@IQ2026`
- Đổi mật khẩu khi host: đặt biến môi trường `RC_PASSWORD` trước khi chạy, ví dụ:

```bash
RC_PASSWORD='matkhau-cua-ban' yarn dev
```

> Mật khẩu này cho phép cả đọc lẫn **publish** Remote Config production — coi như deploy key, chỉ chia sẻ cho người được phép.

## Host lên server công ty (Docker)

Cách khuyến nghị để chạy production: dùng Docker. Web được build sẵn thành file tĩnh và **chính server Express phục vụ luôn cả UI lẫn `/api` trên cùng 1 cổng `4000`** — không cần Vite, không cần proxy.

**Chuẩn bị trên server:**

1. Copy 2 file vào cùng thư mục với `docker-compose.yml`:
   - `service-account.json` (key Firebase — secret, đã gitignore, KHÔNG nằm trong image)
   - `.env` (tùy chọn) để đặt mật khẩu:
     ```
     RC_PASSWORD=matkhau-cua-ban
     ```

2. Build & chạy:

```bash
docker compose up -d --build
```

3. Truy cập: `http://<ip-server>:4000` — nhập mật khẩu là dùng được.

**Lệnh hữu ích:**

| Lệnh | Mô tả |
|---|---|
| `docker compose up -d --build` | Build image + chạy nền |
| `docker compose logs -f` | Xem log |
| `docker compose down` | Dừng & xóa container |
| `docker compose restart` | Restart sau khi đổi `.env` |

> Đổi mật khẩu: sửa `RC_PASSWORD` trong `.env` rồi `docker compose up -d` lại. Mật khẩu mặc định nếu không đặt: `Falcon@IQ2026`.

**Không dùng Docker?** Có thể chạy thẳng:

```bash
yarn install
yarn build                       # build web tĩnh → web/dist
RC_PASSWORD='...' yarn start      # server phục vụ UI + API tại http://localhost:4000
```

## Tính năng

- Form editor trực quan (slider trọng số, hiển thị % chuẩn hóa, toggle, number input)
- Live JSON preview theo từng thay đổi
- Validate bằng Zod + Firebase `validateTemplate` trước khi publish
- Diff modal xác nhận (JSON cũ vs mới) trước khi đẩy lên
- ETag optimistic concurrency — báo conflict nếu template bị sửa từ nơi khác
- Lịch sử version + rollback
- An toàn: chỉ sửa `defaultValue` của đúng 3 keys, mọi parameter/condition khác giữ nguyên

## Scripts

| Lệnh | Mô tả |
|---|---|
| `yarn dev` | Chạy cả API (4000) + web (5173) |
| `yarn typecheck` | Kiểm tra TypeScript cả server + web |
