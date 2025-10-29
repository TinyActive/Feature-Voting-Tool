# Feature Voting Platform

![Feature Voting Platform](https://img.shields.io/badge/Status-Active-brightgreen)

[English](README.md) | Tiếng Việt

Hệ thống bình chọn tính năng đa ngôn ngữ (Tiếng Anh và Tiếng Việt) cho phép người dùng đề xuất và bình chọn cho các tính năng mới. Dự án này sử dụng Cloudflare Workers làm backend và React làm frontend.

## Tính năng

- 🌐 Hỗ trợ đa ngôn ngữ (Tiếng Anh và Tiếng Việt)
- 🗳️ Bình chọn cho các tính năng (ủng hộ/không ủng hộ)
- 🔒 Xác thực quản trị viên
- 📊 Thống kê và phân tích
- 💬 Bình luận về các tính năng
- 🔄 Đề xuất tính năng mới từ người dùng
- 📧 Thông báo email khi đề xuất được duyệt/từ chối
- 📱 Giao diện thân thiện với thiết bị di động
- 🛡️ Bảo vệ reCAPTCHA v3 (chống spam)

## Kiến trúc

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Cloudflare Workers + D1 (SQLite)
- **Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (API)
- **CI/CD**: GitHub Actions
- **Thông báo**: Telegram Bot API (tùy chọn)
- **Email**: Resend API hoặc SendGrid (tùy chọn, để thông báo người dùng)
- **Bảo mật**: Google reCAPTCHA v3 (chống spam)

## Cấu trúc dự án

Dự án được chia thành hai phần chính:

### Frontend (React + TypeScript + Vite)

```
frontend/
├── public/           # Tài nguyên tĩnh và file localization
│   ├── _redirects    # Cấu hình chuyển hướng cho Cloudflare Pages
│   └── locales/      # File ngôn ngữ (en, vi)
├── src/
│   ├── components/   # React components
│   ├── contexts/     # Context API (Auth, etc.)
│   ├── lib/          # Utilities và API client
│   ├── pages/        # Các trang chính
│   ├── App.tsx       # Component chính
│   └── main.tsx      # Entry point
└── vite.config.ts    # Cấu hình Vite
```

### Backend (Cloudflare Workers + TypeScript)

```
worker/
├── src/
│   ├── db/           # Cấu trúc cơ sở dữ liệu và truy vấn
│   ├── handlers/     # Xử lý API endpoints
│   ├── middleware/   # Middleware (rate limiting, auth)
│   ├── utils/        # Tiện ích
│   └── index.ts      # Entry point
├── setup-resources.sh # Script cài đặt tài nguyên Cloudflare
└── wrangler.toml     # Cấu hình Cloudflare Workers
```

## Yêu cầu hệ thống

- Node.js 18+ và npm
- Tài khoản Cloudflare (cho Workers, D1 Database, và KV Storage)
- Tài khoản GitHub
- Bot Telegram (tùy chọn, cho thông báo)

## Cài đặt và phát triển

### 1. Clone dự án

```bash
git clone https://github.com/yourusername/feature-voting.git
cd feature-voting
```

### 2. Cài đặt dependencies

```bash
# Cài đặt dependencies cho frontend
cd frontend
npm install

# Cài đặt dependencies cho worker
cd ../worker
npm install
```

### 3. Cấu hình Cloudflare Workers

1. Đăng nhập vào Cloudflare CLI:

```bash
npx wrangler login
```

2. Chạy script cài đặt tài nguyên:

```bash
chmod +x setup-resources.sh
./setup-resources.sh
```

Script này sẽ tạo:
- D1 Database cho lưu trữ dữ liệu
- KV Namespace cho rate limiting

3. Cài đặt các biến môi trường bí mật:

```bash
npx wrangler secret put ADMIN_TOKEN
# Nhập token quản trị viên của bạn

# reCAPTCHA v3 (bắt buộc để chống spam)
npx wrangler secret put RECAPTCHA_SECRET_KEY
# Nhập secret key reCAPTCHA từ https://www.google.com/recaptcha/admin

# Nếu bạn muốn thông báo qua Telegram (tùy chọn)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID

# Nếu bạn muốn gửi email (tùy chọn)
npx wrangler secret put RESEND_API_KEY
```

### 4. Khởi tạo cơ sở dữ liệu

```bash
# Tạo cơ sở dữ liệu từ schema
npx wrangler d1 execute feature-voting-db --file=./src/db/schema.sql
```

### 5. Cấu hình môi trường frontend

Tạo file `.env.local` trong thư mục `frontend`:

```bash
cd frontend
cp .env.example .env.local
```

Chỉnh sửa `.env.local` và cập nhật các giá trị:

```env
VITE_API_URL=http://localhost:8787
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

### 6. Phát triển cục bộ

```bash
# Chạy worker backend
cd worker
npm run dev

# Trong terminal khác, chạy frontend
cd frontend
npm run dev
```

Frontend sẽ chạy tại http://localhost:5173 và worker backend sẽ chạy tại http://localhost:8787.

## Biến môi trường

### Frontend (.env)

```
VITE_API_URL=http://localhost:8787  # URL của worker API (local development)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key  # Site key reCAPTCHA v3
```

Trong production, `VITE_API_URL` nên được đặt thành URL của worker đã triển khai, ví dụ:
```
VITE_API_URL=https://feature-voting-worker.yourdomain.workers.dev
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Hoặc nếu bạn sử dụng tên miền tùy chỉnh:
```
VITE_API_URL=https://api.idea.yourdomain.com
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### Backend (wrangler.toml và secrets)

Cấu hình trong wrangler.toml:
- `name`: Tên của worker
- `APP_URL`: URL của frontend
- `RECAPTCHA_SITE_KEY`: Site key công khai reCAPTCHA v3
- `database_id`: ID của D1 database
- `id`: ID của KV namespace

Biến môi trường bí mật (đặt bằng `wrangler secret put`):
- `ADMIN_TOKEN`: Token xác thực quản trị viên
- `RECAPTCHA_SECRET_KEY`: Secret key reCAPTCHA v3 (bắt buộc)
- `TELEGRAM_BOT_TOKEN`: Token bot Telegram (tùy chọn)
- `TELEGRAM_CHAT_ID`: ID chat Telegram (tùy chọn)
- `RESEND_API_KEY`: API key cho dịch vụ email Resend (tùy chọn)
- `TURNSTILE_SECRET_KEY`: Secret key cho Cloudflare Turnstile (tùy chọn, chống spam)

## Triển khai
Dự án này được cấu hình để triển khai tự động thông qua GitHub Actions khi có push vào nhánh main. Quá trình triển khai sử dụng Cloudflare Pages cho frontend và Cloudflare Workers cho backend.

### Cấu hình GitHub Actions

Thêm các secrets sau vào repository GitHub của bạn:

- `CF_API_KEY`: Cloudflare API key (Lấy từ Cloudflare Dashboard > My Profile > API Tokens > Create Token > Edit Cloudflare Workers template)
- `CF_EMAIL`: Email Cloudflare của bạn (Email đăng nhập vào tài khoản Cloudflare)
- `CF_ACCOUNT_ID`: ID tài khoản Cloudflare (Lấy từ Cloudflare Dashboard > Workers & Pages > Overview > Account ID)
- `CF_D1_DATABASE_ID`: ID của D1 database (Lấy từ Cloudflare Dashboard > Workers & Pages > D1 > Database > Database ID)
- `CF_KV_NAMESPACE_ID`: ID của KV namespace (Lấy từ Cloudflare Dashboard > Workers & Pages > KV > Namespace ID)
- `ADMIN_TOKEN`: Token quản trị viên (Tự tạo một chuỗi ngẫu nhiên an toàn)
- `RECAPTCHA_SITE_KEY`: Site key reCAPTCHA v3 (Lấy từ https://www.google.com/recaptcha/admin)
- `RECAPTCHA_SECRET_KEY`: Secret key reCAPTCHA v3 (Lấy từ https://www.google.com/recaptcha/admin)
- `TELEGRAM_BOT_TOKEN`: Token bot Telegram (Lấy từ BotFather trên Telegram, tùy chọn)
- `TELEGRAM_CHAT_ID`: ID chat Telegram (ID của chat hoặc channel để nhận thông báo, tùy chọn)
- `RESEND_API_KEY`: API key Resend (Lấy từ trang web Resend.com, tùy chọn)
- `APP_URL`: URL của ứng dụng frontend (Mặc định là https://idea.nginxwaf.me nếu không được đặt)

### Hướng dẫn lấy các biến môi trường từ Cloudflare

1. **CF_API_KEY và CF_ACCOUNT_ID**:
   - Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Đi đến My Profile > API Tokens > Create Token
   - Chọn template "Edit Cloudflare Workers"
   - Sau khi tạo, sao chép token để sử dụng làm CF_API_KEY
   - Để lấy CF_ACCOUNT_ID, vào Workers & Pages > Overview, Account ID sẽ hiển thị ở góc phải

2. **CF_D1_DATABASE_ID**:
   - Trong Cloudflare Dashboard, đi đến Workers & Pages > D1
   - Chọn database của bạn (hoặc tạo mới nếu chưa có)
   - Database ID sẽ hiển thị trong trang chi tiết

3. **CF_KV_NAMESPACE_ID**:
   - Trong Cloudflare Dashboard, đi đến Workers & Pages > KV
   - Tạo namespace mới hoặc chọn namespace hiện có
   - ID sẽ hiển thị trong danh sách namespace

4. **RECAPTCHA_SITE_KEY và RECAPTCHA_SECRET_KEY**:
   - Truy cập [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Nhấp "+" để đăng ký trang web mới
   - Chọn "reCAPTCHA v3"
   - Thêm các tên miền của bạn (ví dụ: `idea.nginxwaf.me`, `localhost` để test)
   - Sau khi đăng ký, sao chép **Site Key** (công khai) và **Secret Key** (bí mật)
   - Thêm cả hai key vào GitHub Secrets

### Triển khai thủ công

```bash
# Triển khai worker
cd worker
npm run deploy

# Triển khai frontend
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=feature-voting-frontend
```

## Cấu trúc cơ sở dữ liệu

Dự án sử dụng Cloudflare D1 (SQLite) với các bảng sau:

- `features`: Lưu trữ các tính năng
- `users`: Thông tin người dùng
- `user_sessions`: Phiên đăng nhập
- `feature_suggestions`: Đề xuất tính năng từ người dùng
- `comments`: Bình luận về tính năng
- `votes`: Lưu trữ phiếu bầu

Schema đầy đủ có thể được tìm thấy trong `worker/src/db/schema.sql`.

## Tính năng bảo mật

### Tích hợp reCAPTCHA v3

Ứng dụng này sử dụng Google reCAPTCHA v3 để bảo vệ chống spam và lạm dụng. Tất cả các form gửi đều được bảo vệ:

- Đăng nhập người dùng (yêu cầu magic link)
- Bình chọn (ủng hộ/không ủng hộ)
- Đề xuất tính năng
- Bình luận
- Hành động quản trị (tạo/cập nhật tính năng)

**Tính năng chính:**
- **Ẩn Badge**: Badge reCAPTCHA được ẩn hoàn toàn để tránh ảnh hưởng giao diện
- **Dựa trên điểm số**: Sử dụng điểm phân tích rủi ro (0.0 = bot, 1.0 = người thật)
- **Ngưỡng có thể cấu hình**: Điểm tối thiểu mặc định là 0.5 (có thể điều chỉnh trong `worker/src/utils/recaptcha.ts`)
- **Giảm tải nhẹ nhàng**: Nếu key chưa được cấu hình, xác minh sẽ bị bỏ qua với cảnh báo

**Hướng dẫn cài đặt:**

Xem [RECAPTCHA_SETUP.md](RECAPTCHA_SETUP.md) để biết hướng dẫn cài đặt chi tiết, bao gồm:
- Cách lấy key reCAPTCHA
- Các bước cấu hình
- Hướng dẫn khắc phục sự cố
- Yêu cầu thông báo quyền riêng tư

**Lưu ý quan trọng:**
- reCAPTCHA v3 yêu cầu HTTPS trong môi trường production
- Thêm tên miền của bạn vào bảng điều khiển quản trị reCAPTCHA
- Bao gồm thông báo quyền riêng tư: "Trang web này được bảo vệ bởi reCAPTCHA và Chính sách quyền riêng tư cũng như Điều khoản dịch vụ của Google được áp dụng."

## Tùy chỉnh

### Thay đổi tên miền

1. Cập nhật `APP_URL` trong `wrangler.toml`
2. Cập nhật `routes` trong `wrangler.toml` để trỏ đến tên miền API của bạn
3. Cấu hình tên miền tùy chỉnh trong cài đặt Cloudflare Pages

### Thêm ngôn ngữ mới

1. Tạo file ngôn ngữ mới trong `frontend/public/locales/`
2. Cập nhật schema cơ sở dữ liệu để thêm các trường ngôn ngữ mới

## API Endpoints

### Public API

- `GET /api/features`: Lấy danh sách tính năng
- `POST /api/features/:id/vote`: Bình chọn cho tính năng
- `GET /api/suggestions`: Lấy đề xuất tính năng
- `POST /api/suggestions`: Tạo đề xuất tính năng mới

### Admin API (yêu cầu xác thực)

- `POST /api/admin/features`: Tạo tính năng mới
- `PUT /api/admin/features/:id`: Cập nhật tính năng
- `DELETE /api/admin/features/:id`: Xóa tính năng
- `GET /api/admin/stats`: Lấy thống kê
- `GET /api/admin/suggestions`: Lấy đề xuất tính năng đang chờ xử lý
- `PUT /api/admin/suggestions/:id/approve`: Phê duyệt đề xuất
- `PUT /api/admin/suggestions/:id/reject`: Từ chối đề xuất

## Đóng góp

Đóng góp luôn được chào đón! Vui lòng tạo issue hoặc pull request.

## Giấy phép

Apache License 2.0