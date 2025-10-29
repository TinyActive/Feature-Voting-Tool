# Feature Voting Platform

![Feature Voting Platform](https://img.shields.io/badge/Status-Active-brightgreen)

English | [Tiếng Việt](README.vi.md)

A multilingual feature voting system (English and Vietnamese) that allows users to suggest and vote for new features. This project uses Cloudflare Workers as the backend and React as the frontend.

## Features

- 🌐 Multilingual support (English and Vietnamese)
- 🗳️ Vote for features (upvote/downvote)
- 🔒 Admin authentication
- 📊 Statistics and analytics
- 💬 Comments on features
- 🔄 New feature suggestions from users
- 📧 Email notifications for suggestion approvals/rejections
- 📱 Mobile-friendly interface
- 🛡️ reCAPTCHA v3 protection (spam prevention)

## Architecture

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Cloudflare Workers + D1 (SQLite)
- **Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (API)
- **CI/CD**: GitHub Actions
- **Notifications**: Telegram Bot API (optional)
- **Email**: Resend API or SendGrid (optional, for user notifications)
- **Security**: Google reCAPTCHA v3 (spam protection)

## Project Structure

The project is divided into two main parts:

### Frontend (React + TypeScript + Vite)

```
frontend/
├── public/           # Static resources and localization files
│   ├── _redirects    # Redirect configuration for Cloudflare Pages
│   └── locales/      # Language files (en, vi)
├── src/
│   ├── components/   # React components
│   ├── contexts/     # Context API (Auth, etc.)
│   ├── lib/          # Utilities and API client
│   ├── pages/        # Main pages
│   ├── App.tsx       # Main component
│   └── main.tsx      # Entry point
└── vite.config.ts    # Vite configuration
```

### Backend (Cloudflare Workers + TypeScript)

```
worker/
├── src/
│   ├── db/           # Database structure and queries
│   ├── handlers/     # API endpoint handlers
│   ├── middleware/   # Middleware (rate limiting, auth)
│   ├── utils/        # Utilities
│   └── index.ts      # Entry point
├── setup-resources.sh # Cloudflare resources setup script
└── wrangler.toml     # Cloudflare Workers configuration
```

## System Requirements

- Node.js 18+ and npm
- Cloudflare account (for Workers, D1 Database, and KV Storage)
- GitHub account
- Telegram bot (optional, for notifications)

## Installation and Development

### 1. Clone the project

```bash
git clone https://github.com/yourusername/feature-voting.git
cd feature-voting
```

### 2. Install dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install worker dependencies
cd ../worker
npm install
```

### 3. Configure Cloudflare Workers

1. Log in to Cloudflare CLI:

```bash
npx wrangler login
```

2. Run the resource setup script:

```bash
chmod +x setup-resources.sh
./setup-resources.sh
```

This script will create:
- D1 Database for data storage
- KV Namespace for rate limiting

3. Set up secret environment variables:

```bash
npx wrangler secret put ADMIN_TOKEN
# Enter your admin token

# reCAPTCHA v3 (required for spam protection)
npx wrangler secret put RECAPTCHA_SECRET_KEY
# Enter your reCAPTCHA secret key from https://www.google.com/recaptcha/admin

# If you want notifications via Telegram (optional)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID

# If you want to send emails (optional)
npx wrangler secret put RESEND_API_KEY
```

### 4. Initialize the database

```bash
# Create database from schema
npx wrangler d1 execute feature-voting-db --file=./src/db/schema.sql
```

### 5. Configure frontend environment

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local` and update the values:

```env
VITE_API_URL=http://localhost:8787
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

### 6. Local development

```bash
# Run worker backend
cd worker
npm run dev

# In another terminal, run frontend
cd frontend
npm run dev
```

The frontend will run at http://localhost:5173 and the worker backend will run at http://localhost:8787.

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:8787  # Worker API URL (local development)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key  # reCAPTCHA v3 site key
```

In production, `VITE_API_URL` should be set to the deployed worker URL, for example:
```
VITE_API_URL=https://feature-voting-worker.yourdomain.workers.dev
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Or if you use a custom domain:
```
VITE_API_URL=https://api.idea.yourdomain.com
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### Backend (wrangler.toml and secrets)

Configuration in wrangler.toml:
- `name`: Worker name
- `APP_URL`: Frontend URL
- `RECAPTCHA_SITE_KEY`: reCAPTCHA v3 public site key
- `database_id`: D1 database ID
- `id`: KV namespace ID

Secret environment variables (set with `wrangler secret put`):
- `ADMIN_TOKEN`: Admin authentication token
- `RECAPTCHA_SECRET_KEY`: reCAPTCHA v3 secret key (required)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token (optional)
- `TELEGRAM_CHAT_ID`: Telegram chat ID (optional)
- `RESEND_API_KEY`: API key for Resend email service (optional, for user notifications)
- `SENDGRID_API_KEY`: API key for SendGrid email service (optional, alternative to Resend)
- `TURNSTILE_SECRET_KEY`: Secret key for Cloudflare Turnstile (optional, anti-spam)

## Deployment

This project is configured to deploy automatically via GitHub Actions when pushed to the main branch. The deployment uses Cloudflare Pages for the frontend and Cloudflare Workers for the backend.

### GitHub Actions Configuration

Add the following secrets to your GitHub repository:

| Variable name | Describe | Request |
|----------|-------|--------|
| `CF_API_KEY` | Cloudflare API key (Get from Cloudflare Dashboard > My Profile > API Tokens > Create Token > Edit Cloudflare Workers template) | Bắt buộc |
| `CF_EMAIL` | Your Cloudflare email (Login email for your Cloudflare account) | Required |
| `CF_ACCOUNT_ID` | Cloudflare account ID (Get from Cloudflare Dashboard > Workers & Pages > Overview > Account ID) | Required |
| `CF_D1_DATABASE_ID` | D1 database ID (Get from Cloudflare Dashboard > Workers & Pages > D1 > Database > Database ID) | Required |
| `CF_KV_NAMESPACE_ID` | KV namespace ID (Get from Cloudflare Dashboard > Workers & Pages > KV > Namespace ID) | Required |
| `ADMIN_TOKEN` | Admin token (Create a secure random string) | Required |
| `RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key (Get from https://www.google.com/recaptcha/admin) | Required |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret key (Get from https://www.google.com/recaptcha/admin) | Required |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (Get from BotFather on Telegram) | Optional |
| `TELEGRAM_CHAT_ID` | Telegram chat ID (ID of the chat or channel to receive notifications) | Optional |
| `RESEND_API_KEY` | Resend API key (Get from Resend.com website) | Optional |
| `APP_URL` | Frontend application URL (Defaults to https://idea.nginxwaf.me if not set) | Optional |

### How to Get Environment Variables from Cloudflare

1. **CF_API_KEY and CF_ACCOUNT_ID**:
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Go to My Profile > API Tokens > Create Token
   - Select the "Edit Cloudflare Workers" template
   - After creation, copy the token to use as CF_API_KEY
   - To get CF_ACCOUNT_ID, go to Workers & Pages > Overview, Account ID will be displayed in the right corner

2. **CF_D1_DATABASE_ID**:
   - In Cloudflare Dashboard, go to Workers & Pages > D1
   - Select your database (or create a new one if you don't have one)
   - The Database ID will be displayed in the details page

3. **CF_KV_NAMESPACE_ID**:
   - In Cloudflare Dashboard, go to Workers & Pages > KV
   - Create a new namespace or select an existing one
   - The ID will be displayed in the namespace list

4. **RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY**:
   - Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Click "+" to register a new site
   - Select "reCAPTCHA v3"
   - Add your domains (e.g., `idea.nginxwaf.me`, `localhost` for testing)
   - After registration, copy the **Site Key** (public) and **Secret Key** (private)
   - Add both keys to GitHub Secrets

### Manual Deployment

```bash
# Deploy worker
cd worker
npm run deploy

# Deploy frontend
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=feature-voting-frontend
```

## Database Structure

The project uses Cloudflare D1 (SQLite) with the following tables:

- `features`: Stores features
- `users`: User information
- `user_sessions`: Login sessions
- `feature_suggestions`: Feature suggestions from users
- `comments`: Comments on features
- `votes`: Stores votes

The full schema can be found in `worker/src/db/schema.sql`.

## Security Features

### reCAPTCHA v3 Integration

This application uses Google reCAPTCHA v3 to protect against spam and abuse. All form submissions are protected:

- ✅ User login (magic link requests)
- ✅ Voting (upvote/downvote)
- ✅ Feature suggestions
- ✅ Comments
- ✅ Admin actions (create/update features)

**Key Features:**
- **Hidden Badge**: The reCAPTCHA badge is completely hidden to avoid UI interference
- **Score-based**: Uses risk analysis scores (0.0 = bot, 1.0 = human)
- **Configurable Threshold**: Default minimum score is 0.5 (adjustable in `worker/src/utils/recaptcha.ts`)
- **Graceful Degradation**: If keys are not configured, verification is skipped with a warning

**Setup Instructions:**

See [RECAPTCHA_SETUP.md](RECAPTCHA_SETUP.md) for detailed setup instructions, including:
- How to get reCAPTCHA keys
- Configuration steps
- Troubleshooting guide
- Privacy notice requirements

**Important Notes:**
- reCAPTCHA v3 requires HTTPS in production
- Add your domains to the reCAPTCHA admin console
- Include privacy notice: "This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply."

### Email Notifications

The system automatically sends email notifications to users when their feature suggestions are approved or rejected by admins.

**Supported Email Services:**
- **Resend** (recommended) - Modern email API with 3,000 emails/month free tier
- **SendGrid** - Popular email service with 100 emails/day free tier

**Setup Instructions:**

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed setup instructions, including:
- How to configure Resend or SendGrid
- Email template customization
- Testing and troubleshooting
- Security best practices

**Email Templates:**
- ✅ **Approval Email**: Sent when a suggestion is approved and converted to a feature
- ✅ **Rejection Email**: Sent when a suggestion is rejected with helpful feedback

Both templates are bilingual (English/Vietnamese) with beautiful HTML design and plain text fallback.

## Customization

### Changing the domain

1. Update `APP_URL` in `wrangler.toml`
2. Update `routes` in `wrangler.toml` to point to your API domain
3. Configure your custom domain in Cloudflare Pages settings

### Adding a new language

1. Create a new language file in `frontend/public/locales/`
2. Update the database schema to add new language fields

## API Endpoints

### Public API

- `GET /api/features`: Get list of features
- `POST /api/features/:id/vote`: Vote for a feature
- `GET /api/suggestions`: Get feature suggestions
- `POST /api/suggestions`: Create a new feature suggestion

### Admin API (requires authentication)

- `POST /api/admin/features`: Create a new feature
- `PUT /api/admin/features/:id`: Update a feature
- `DELETE /api/admin/features/:id`: Delete a feature
- `GET /api/admin/stats`: Get statistics
- `GET /api/admin/suggestions`: Get pending feature suggestions
- `PUT /api/admin/suggestions/:id/approve`: Approve a suggestion
- `PUT /api/admin/suggestions/:id/reject`: Reject a suggestion

## Contributing

Contributions are always welcome! Please create an issue or pull request.

## License

Apache License 2.0
