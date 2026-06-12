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
| `yarn build:web` | Build production web |
