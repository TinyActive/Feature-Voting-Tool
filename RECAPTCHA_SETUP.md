# reCAPTCHA v3 Integration Guide

This document explains the reCAPTCHA v3 integration added to the Feature Voting application.

## Overview

reCAPTCHA v3 has been integrated into all form submissions to protect against spam and abuse. The badge is hidden to avoid interfering with the user experience.

## Features

- ✅ reCAPTCHA v3 verification on all form submissions
- ✅ Hidden badge for better UX
- ✅ Applies to both regular users and admin accounts
- ✅ Secure key management via GitHub Secrets
- ✅ Preserves existing KV database data during upgrades

## Protected Actions

All the following actions now require reCAPTCHA verification:

1. **User Login** - Magic link email requests
2. **Voting** - Upvoting or downvoting features
3. **Feature Suggestions** - Submitting new feature ideas
4. **Comments** - Creating comments on features
5. **Admin Actions**:
   - Creating new features
   - Updating existing features

## Setup Instructions

### 1. Get reCAPTCHA v3 Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Register a new site with reCAPTCHA v3
3. Add your domains (e.g., `idea.nginxwaf.me`)
4. Copy the **Site Key** and **Secret Key**

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example |
|------------|-------------|---------|
| `RECAPTCHA_SITE_KEY` | Public site key from Google reCAPTCHA | `your-site-key-here` |
| `RECAPTCHA_SECRET_KEY` | Secret key from Google reCAPTCHA | `your-secret-key-here` |

### 3. Update wrangler.toml (Local Development)

For local development, update `worker/wrangler.toml`:

```toml
[vars]
APP_URL = "http://localhost:5173"
RECAPTCHA_SITE_KEY = "your-site-key-here"
```

Then set the secret locally:

```bash
cd worker
echo "your-secret-key" | npx wrangler secret put RECAPTCHA_SECRET_KEY
```

### 4. Deploy

The GitHub Actions workflow will automatically:
- Build the frontend with `VITE_RECAPTCHA_SITE_KEY`
- Deploy the worker with `RECAPTCHA_SECRET_KEY` and `RECAPTCHA_SITE_KEY`
- Preserve existing KV database data

## Technical Implementation

### Frontend

- **Hidden Badge**: CSS in `index.html` hides the reCAPTCHA badge
- **Hook**: `useRecaptcha()` hook provides `executeRecaptcha()` function
- **Forms**: All forms call `executeRecaptcha(action)` before submission

### Backend

- **Verification**: `verifyRecaptcha()` utility validates tokens with Google
- **Score Threshold**: Minimum score of 0.5 (configurable)
- **Action Validation**: Verifies the action name matches expected value
- **Graceful Degradation**: If `RECAPTCHA_SECRET_KEY` is not set, verification is skipped with a warning

## Data Safety

The deployment process ensures:

1. **KV Namespace**: Existing KV data is never deleted
   - Script checks if namespace exists before creating
   - Uses existing namespace ID if found
   - Only creates new namespace if none exists

2. **D1 Database**: Migrations are additive only
   - Schema changes are applied via migrations
   - Existing data is preserved
   - No DROP or TRUNCATE operations

## Troubleshooting

### reCAPTCHA Not Working

1. **Check Console**: Open browser DevTools and check for errors
2. **Verify Keys**: Ensure GitHub secrets are set correctly
3. **Domain Whitelist**: Add your domain to reCAPTCHA console
4. **HTTPS Required**: reCAPTCHA v3 requires HTTPS in production

### Badge Visible

The badge should be hidden by CSS. If visible:
- Check that `index.html` includes the hide badge CSS
- Clear browser cache
- Verify CSS is not being overridden

### Low Scores

If legitimate users are blocked:
- Lower the score threshold in `worker/src/utils/recaptcha.ts`
- Default is 0.5, can be lowered to 0.3
- Check Google reCAPTCHA console for score distribution

## Privacy Notice

Add this to your privacy policy:

```
This site is protected by reCAPTCHA and the Google Privacy Policy 
and Terms of Service apply.
```

## Links

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Google Privacy Policy](https://policies.google.com/privacy)
- [Google Terms of Service](https://policies.google.com/terms)
