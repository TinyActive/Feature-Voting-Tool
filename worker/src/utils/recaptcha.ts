import { Env } from '../index'

interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
  challenge_ts: string
  hostname: string
  'error-codes'?: string[]
}

/**
 * Verify reCAPTCHA v3 token
 * @param token - reCAPTCHA token from frontend
 * @param env - Worker environment
 * @param expectedAction - Expected action name (optional)
 * @param minScore - Minimum score threshold (default: 0.5)
 * @returns true if verification passes, false otherwise
 */
export async function verifyRecaptcha(
  token: string,
  env: Env,
  expectedAction?: string,
  minScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  if (!token) {
    return { success: false, error: 'reCAPTCHA token is required' }
  }

  if (!env.RECAPTCHA_SECRET_KEY) {
    console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification')
    return { success: true, score: 1.0 }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(env.RECAPTCHA_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
    })

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes'])
      return { 
        success: false, 
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ') || 'Unknown error'}` 
      }
    }

    // Check score
    if (data.score < minScore) {
      console.warn(`reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`)
      return { 
        success: false, 
        score: data.score,
        error: `Security check failed. Please try again.` 
      }
    }

    // Check action if provided
    if (expectedAction && data.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`)
      return { 
        success: false, 
        error: 'Invalid security token' 
      }
    }

    return { success: true, score: data.score }
  } catch (error: any) {
    console.error('reCAPTCHA verification error:', error)
    return { 
      success: false, 
      error: 'Failed to verify security token' 
    }
  }
}
