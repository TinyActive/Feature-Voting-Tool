# Email Notification Setup Guide

This guide explains how to set up email notifications for feature suggestion approvals and rejections.

## Overview

When an admin approves or rejects a feature suggestion, the system will automatically send an email notification to the user who submitted the suggestion.

## Email Templates

The system includes two email templates:

1. **Approval Email** - Sent when a suggestion is approved and converted to a feature
2. **Rejection Email** - Sent when a suggestion is rejected

Both templates are bilingual (English/Vietnamese) and include:
- Beautiful HTML design with gradient headers
- Clear call-to-action buttons
- Plain text fallback for email clients that don't support HTML

## Supported Email Services

The system supports two email service providers:

### Option 1: Resend (Recommended)

[Resend](https://resend.com) is a modern email API service with a generous free tier.

**Setup Steps:**

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their testing domain for development)
3. Create an API key
4. Add the API key to your Cloudflare Worker secrets:

```bash
wrangler secret put RESEND_API_KEY
```

**Free Tier:** 3,000 emails/month, 100 emails/day

### Option 2: SendGrid

[SendGrid](https://sendgrid.com) is a popular email service provider.

**Setup Steps:**

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your domain
3. Create an API key with "Mail Send" permissions
4. Add the API key to your Cloudflare Worker secrets:

```bash
wrangler secret put SENDGRID_API_KEY
```

**Free Tier:** 100 emails/day

## Configuration

### 1. Set Email Service API Key

Choose one of the email services above and set the corresponding secret:

```bash
# For Resend
wrangler secret put RESEND_API_KEY

# OR for SendGrid
wrangler secret put SENDGRID_API_KEY
```

### 2. Update Email Sender Address

Edit `worker/src/utils/email.ts` and update the sender email addresses:

For Resend (line 42):
```typescript
from: 'Feature Voting <noreply@update.nginxwaf.me>',
```

For SendGrid (line 67):
```typescript
from: { email: 'noreply@update.nginxwaf.me', name: 'Feature Voting' },
```

**Important:** Make sure the sender domain is verified with your email service provider.

### 3. Verify APP_URL Configuration

The email templates use `APP_URL` to generate links. Verify it's set correctly in `wrangler.toml`:

```toml
[vars]
APP_URL = "https://idea.nginxwaf.me"
```

## Testing

### Development Mode (No Email Service)

If no email service API key is configured, the system will log email details to the console instead of sending actual emails. This is useful for development and testing.

You'll see logs like:
```
📧 Email would be sent to: user@example.com
📧 Subject: 🎉 Your Feature Suggestion Has Been Approved!
📧 Full email preview: ...
```

### Testing with Real Emails

1. Configure an email service (Resend or SendGrid)
2. Create a test user account
3. Submit a feature suggestion as that user
4. Login as admin and approve/reject the suggestion
5. Check the user's email inbox

## Email Content

### Approval Email

**Subject:** 🎉 Your Feature Suggestion Has Been Approved!

**Content:**
- Congratulatory message
- Feature title (English and Vietnamese)
- Link to view the created feature
- Encouragement to submit more suggestions

### Rejection Email

**Subject:** 📋 Update on Your Feature Suggestion

**Content:**
- Polite notification of rejection
- Feature title (English and Vietnamese)
- Common reasons for rejection
- Encouragement to submit more suggestions
- Link to submit another suggestion

## Troubleshooting

### Emails Not Being Sent

1. **Check API Key:** Ensure the API key is set correctly:
   ```bash
   wrangler secret list
   ```

2. **Check Logs:** View Worker logs for error messages:
   ```bash
   wrangler tail
   ```

3. **Verify Domain:** Make sure your sender domain is verified with the email service

4. **Check Rate Limits:** Ensure you haven't exceeded the free tier limits

### Emails Going to Spam

1. **Verify Domain:** Use a verified domain instead of a generic email
2. **SPF/DKIM Records:** Configure proper DNS records (your email service will provide these)
3. **Sender Reputation:** Use a consistent sender address

## Security Best Practices

1. **Never commit API keys** - Always use Wrangler secrets
2. **Use environment-specific keys** - Different keys for development and production
3. **Rotate keys regularly** - Change API keys periodically
4. **Monitor usage** - Check your email service dashboard for unusual activity

## Cost Considerations

Both Resend and SendGrid offer generous free tiers that should be sufficient for most small to medium projects:

- **Resend:** 3,000 emails/month free
- **SendGrid:** 100 emails/day free (3,000/month)

For higher volumes, check the pricing pages:
- [Resend Pricing](https://resend.com/pricing)
- [SendGrid Pricing](https://sendgrid.com/pricing)

## Additional Features

### Future Enhancements

Consider implementing these features in the future:

1. **Email Preferences:** Allow users to opt-out of notifications
2. **Digest Emails:** Send weekly summaries instead of individual emails
3. **Rich Notifications:** Include more context about why a suggestion was rejected
4. **Admin Notifications:** Notify admins when new suggestions are submitted
5. **Localized Emails:** Send emails in the user's preferred language only

## Support

For issues or questions:
1. Check the [Resend Documentation](https://resend.com/docs)
2. Check the [SendGrid Documentation](https://docs.sendgrid.com)
3. Review Worker logs: `wrangler tail`
4. Open an issue in the project repository
