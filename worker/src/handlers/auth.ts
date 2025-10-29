import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { sendEmail, generateMagicLinkEmail } from '../utils/email'
import { verifyRecaptcha } from '../utils/recaptcha'

interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: number
  last_login_at: number | null
}

interface Session {
  id: string
  user_id: string
  token: string
  expires_at: number
  created_at: number
}

/**
 * Request magic link login email
 * POST /api/auth/login
 * Body: { email: string }
 */
export async function handleLoginRequest(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json()
    const email = body.email?.trim().toLowerCase()
    const recaptchaToken = body.recaptchaToken

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, env, 'login')
    if (!recaptchaResult.success) {
      return new Response(JSON.stringify({ error: recaptchaResult.error || 'Security verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find or create user
    let user = await getUserByEmail(env, email)
    if (!user) {
      user = await createUser(env, email)
    }

    // Create session token
    const session = await createSession(env, user.id)

    // Generate magic link
    const loginUrl = `${env.APP_URL}/auth/verify?token=${session.token}`

    // Send email
    const { html, text } = generateMagicLinkEmail(loginUrl, email)
    await sendEmail(env, {
      to: email,
      subject: 'Sign in to Feature Voting',
      html,
      text,
    })

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Check your email for a login link' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Login request error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to send login email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Verify magic link token and create session
 * GET /api/auth/verify?token=xxx
 */
export async function handleVerifyToken(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find session by token
    const session = await getSessionByToken(env, token)
    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if expired
    if (session.expires_at < Date.now()) {
      await deleteSession(env, session.id)
      return new Response(JSON.stringify({ error: 'Token expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user
    const user = await getUserById(env, session.user_id)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update last login
    await updateLastLogin(env, user.id)

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: session.token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Verify token error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to verify token' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Get current user from session token
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
export async function handleGetCurrentUser(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.substring(7)
    const session = await getSessionByToken(env, token)

    if (!session || session.expires_at < Date.now()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = await getUserById(env, session.user_id)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Get current user error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to get user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Logout (delete session)
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <token>
 */
export async function handleLogout(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.substring(7)
    const session = await getSessionByToken(env, token)

    if (session) {
      await deleteSession(env, session.id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to logout' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// Helper functions

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function getUserByEmail(env: Env, email: string): Promise<User | null> {
  const result = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first()

  if (!result) return null

  return {
    id: result.id as string,
    email: result.email as string,
    name: result.name as string | null,
    avatar_url: result.avatar_url as string | null,
    created_at: result.created_at as number,
    last_login_at: result.last_login_at as number | null,
  }
}

async function getUserById(env: Env, id: string): Promise<User | null> {
  const result = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first()

  if (!result) return null

  return {
    id: result.id as string,
    email: result.email as string,
    name: result.name as string | null,
    avatar_url: result.avatar_url as string | null,
    created_at: result.created_at as number,
    last_login_at: result.last_login_at as number | null,
  }
}

async function createUser(env: Env, email: string): Promise<User> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await env.DB.prepare(`
    INSERT INTO users (id, email, created_at)
    VALUES (?, ?, ?)
  `).bind(id, email, now).run()

  return {
    id,
    email,
    name: null,
    avatar_url: null,
    created_at: now,
    last_login_at: null,
  }
}

async function createSession(env: Env, userId: string): Promise<Session> {
  const id = crypto.randomUUID()
  const token = crypto.randomUUID() + crypto.randomUUID() // Long token
  const now = Date.now()
  const expiresAt = now + (15 * 60 * 1000) // 15 minutes

  await env.DB.prepare(`
    INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, userId, token, expiresAt, now).run()

  return {
    id,
    user_id: userId,
    token,
    expires_at: expiresAt,
    created_at: now,
  }
}

async function getSessionByToken(env: Env, token: string): Promise<Session | null> {
  const result = await env.DB.prepare('SELECT * FROM user_sessions WHERE token = ?')
    .bind(token)
    .first()

  if (!result) return null

  return {
    id: result.id as string,
    user_id: result.user_id as string,
    token: result.token as string,
    expires_at: result.expires_at as number,
    created_at: result.created_at as number,
  }
}

async function deleteSession(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM user_sessions WHERE id = ?')
    .bind(id)
    .run()
}

async function updateLastLogin(env: Env, userId: string): Promise<void> {
  await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
    .bind(Date.now(), userId)
    .run()
}

// Export helper for other handlers to verify user session
export async function verifyUserSession(request: Request, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const session = await getSessionByToken(env, token)

  if (!session || session.expires_at < Date.now()) {
    return null
  }

  return await getUserById(env, session.user_id)
}
