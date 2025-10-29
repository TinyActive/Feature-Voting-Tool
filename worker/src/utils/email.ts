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

/**
 * Generate suggestion approved email
 */
export function generateSuggestionApprovedEmail(
  titleEn: string,
  titleVi: string,
  featureUrl: string
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Suggestion Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Feature Suggestion Approved!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Great news!</h2>
    
    <p style="color: #6b7280; font-size: 16px;">
      Your feature suggestion has been approved and created as a new feature:
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0;">
      <h3 style="color: #10b981; margin: 0 0 10px 0; font-size: 18px;">📌 ${titleEn}</h3>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">${titleVi}</p>
    </div>
    
    <p style="color: #6b7280; font-size: 16px;">
      Your suggestion is now live and other users can vote on it! Thank you for contributing to making our platform better.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${featureUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Feature
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      Keep suggesting great ideas! We appreciate your contributions.
    </p>
  </div>
</body>
</html>
  `.trim()

  const text = `
🎉 Feature Suggestion Approved!

Great news! Your feature suggestion has been approved and created as a new feature:

📌 ${titleEn}
${titleVi}

Your suggestion is now live and other users can vote on it! Thank you for contributing to making our platform better.

View your feature: ${featureUrl}

Keep suggesting great ideas! We appreciate your contributions.
  `.trim()

  return { html, text }
}

/**
 * Generate suggestion rejected email
 */
export function generateSuggestionRejectedEmail(
  titleEn: string,
  titleVi: string,
  appUrl: string
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Suggestion Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Feature Suggestion Update</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <h2 style="color: #111827; margin-top: 0;">Thank you for your suggestion</h2>
    
    <p style="color: #6b7280; font-size: 16px;">
      We've carefully reviewed your feature suggestion:
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #6b7280; margin: 20px 0;">
      <h3 style="color: #6b7280; margin: 0 0 10px 0; font-size: 18px;">📌 ${titleEn}</h3>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">${titleVi}</p>
    </div>
    
    <p style="color: #6b7280; font-size: 16px;">
      After careful consideration, we've decided not to proceed with this suggestion at this time. This could be due to various reasons such as:
    </p>
    
    <ul style="color: #6b7280; font-size: 15px; line-height: 1.8;">
      <li>The feature doesn't align with our current roadmap</li>
      <li>Similar functionality already exists or is planned</li>
      <li>Technical or resource constraints</li>
      <li>The suggestion needs more refinement</li>
    </ul>
    
    <p style="color: #6b7280; font-size: 16px;">
      We truly appreciate your input and encourage you to continue sharing your ideas. Your feedback helps us improve!
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Submit Another Suggestion
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      Don't be discouraged! Keep sharing your ideas with us.
    </p>
  </div>
</body>
</html>
  `.trim()

  const text = `
📋 Feature Suggestion Update

Thank you for your suggestion!

We've carefully reviewed your feature suggestion:

📌 ${titleEn}
${titleVi}

After careful consideration, we've decided not to proceed with this suggestion at this time. This could be due to various reasons such as:

- The feature doesn't align with our current roadmap
- Similar functionality already exists or is planned
- Technical or resource constraints
- The suggestion needs more refinement

We truly appreciate your input and encourage you to continue sharing your ideas. Your feedback helps us improve!

Submit another suggestion: ${appUrl}

Don't be discouraged! Keep sharing your ideas with us.
  `.trim()

  return { html, text }
}
