import { Env } from '../index'

export interface EmailParams {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Send email using Cloudflare Email Workers or external service
 * For now, using a simple HTTP API approach
 */
export async function sendEmail(env: Env, params: EmailParams): Promise<void> {
  // Option 1: Use Resend API (recommended)
  if (env.RESEND_API_KEY) {
    await sendViaResend(env.RESEND_API_KEY, params)
    return
  }

  // Option 2: Use SendGrid
  if (env.SENDGRID_API_KEY) {
    await sendViaSendGrid(env.SENDGRID_API_KEY, params)
    return
  }

  // Option 3: Log to console for development
  console.log('📧 Email would be sent to:', params.to)
  console.log('📧 Subject:', params.subject)
  console.log('📧 Magic Link:', params.text.match(/http[^\s]+/)?.[0] || 'No link found')
  console.log('📧 Full email preview:', params.text.substring(0, 200))
}

async function sendViaResend(apiKey: string, params: EmailParams): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Feature Voting <noreply@update.nginxwaf.me>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email via Resend: ${error}`)
  }
}

async function sendViaSendGrid(apiKey: string, params: EmailParams): Promise<void> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: params.to }],
      }],
      from: { email: 'noreply@update.nginxwaf.me', name: 'Feature Voting' },
      subject: params.subject,
      content: [
        { type: 'text/plain', value: params.text },
        { type: 'text/html', value: params.html },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email via SendGrid: ${error}`)
  }
}

/**
 * Generate magic link login email
 */
export function generateMagicLinkEmail(loginUrl: string, email: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to Feature Voting</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✨ Feature Voting</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Sign in to your account</h2>
    
    <p style="color: #6b7280; font-size: 16px;">
      Hello! Click the button below to sign in to Feature Voting. This link will expire in 15 minutes.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign In
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
      Or copy and paste this URL into your browser:<br>
      <a href="${loginUrl}" style="color: #667eea; word-break: break-all;">${loginUrl}</a>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      If you didn't request this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Sign in to Feature Voting

Hello! Click the link below to sign in to your account:

${loginUrl}

This link will expire in 15 minutes.

If you didn't request this email, you can safely ignore it.
  `.trim()

  return { html, text }
}
