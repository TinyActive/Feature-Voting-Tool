import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyUserSession } from './auth'
import { verifyAdminToken } from '../middleware/auth'
import { createFeature } from '../db/queries'
import { verifyRecaptcha } from '../utils/recaptcha'
import { sendEmail, generateSuggestionApprovedEmail, generateSuggestionRejectedEmail } from '../utils/email'

// Helper functions to reduce duplication
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function verifyUser(request: Request, env: Env) {
  const user = await verifyUserSession(request, env)
  if (!user) {
    return { user: null, error: jsonResponse({ error: 'Unauthorized' }, 401) }
  }
  return { user, error: null }
}

function verifyAdmin(request: Request, env: Env): Response | null {
  const authResult = verifyAdminToken(request, env)
  if (!authResult.authorized) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  return null
}

function extractSuggestionId(request: Request): string | null {
  const url = new URL(request.url)
  return url.pathname.split('/')[4] || null
}

function mapRowToSuggestion(row: any): Suggestion {
  return {
    id: row.id,
    user_id: row.user_id,
    title: { en: row.title_en, vi: row.title_vi },
    description: { en: row.desc_en || '', vi: row.desc_vi || '' },
    status: row.status,
    approved_feature_id: row.approved_feature_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(row.user_email && { user_email: row.user_email }),
  }
}

async function verifyRecaptchaToken(
  token: string,
  env: Env,
  action: string
): Promise<Response | null> {
  const result = await verifyRecaptcha(token, env, action)
  if (!result.success) {
    return jsonResponse(
      { error: result.error || 'Security verification failed' },
      400
    )
  }
  return null
}

function handleError(operation: string, error: any): Response {
  console.error(`${operation} error:`, error)
  return jsonResponse(
    { error: error.message || `Failed to ${operation.toLowerCase()}` },
    500
  )
}

function validateIdParam(id: string | null, paramName: string): Response | null {
  if (!id) {
    return jsonResponse({ error: `${paramName} required` }, 400)
  }
  return null
}

function validateBilingualTitle(title: any): Response | null {
  if (!title?.en || !title?.vi) {
    return jsonResponse({ error: 'Title (en and vi) required' }, 400)
  }
  return null
}

async function getSuggestionById(
  env: Env,
  suggestionId: string
): Promise<{ suggestion: any; error: Response | null }> {
  const suggestion = await env.DB.prepare('SELECT * FROM feature_suggestions WHERE id = ?')
    .bind(suggestionId)
    .first()

  if (!suggestion) {
    return { suggestion: null, error: jsonResponse({ error: 'Suggestion not found' }, 404) }
  }

  return { suggestion, error: null }
}

async function updateSuggestionStatus(
  env: Env,
  suggestionId: string,
  status: 'approved' | 'rejected',
  featureId?: string
): Promise<void> {
  const query = featureId
    ? 'UPDATE feature_suggestions SET status = ?, approved_feature_id = ?, updated_at = ? WHERE id = ?'
    : 'UPDATE feature_suggestions SET status = ?, updated_at = ? WHERE id = ?'
  
  const params = featureId
    ? [status, featureId, Date.now(), suggestionId]
    : [status, Date.now(), suggestionId]
  
  await env.DB.prepare(query).bind(...params).run()
}

interface Suggestion {
  id: string
  user_id: string
  title: { en: string; vi: string }
  description: { en: string; vi: string }
  status: 'pending' | 'approved' | 'rejected'
  approved_feature_id: string | null
  created_at: number
  updated_at: number
  user_email?: string
}

/**
 * Create a new feature suggestion
 * POST /api/suggestions
 * Headers: Authorization: Bearer <token>
 * Body: { title: { en, vi }, description: { en, vi } }
 */
export async function handleCreateSuggestion(request: Request, env: Env): Promise<Response> {
  try {
    const { user, error } = await verifyUser(request, env)
    if (error) return error

    const body: any = await request.json()
    
    const recaptchaError = await verifyRecaptchaToken(body.recaptchaToken, env, 'suggest_feature')
    if (recaptchaError) return recaptchaError
    
    const titleError = validateBilingualTitle(body.title)
    if (titleError) return titleError

    const id = crypto.randomUUID()
    const now = Date.now()
    const desc = body.description || { en: '', vi: '' }

    await env.DB.prepare(`
      INSERT INTO feature_suggestions (id, user_id, title_en, title_vi, desc_en, desc_vi, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(id, user!.id, body.title.en, body.title.vi, desc.en, desc.vi, now, now).run()

    return jsonResponse({
      id,
      user_id: user!.id,
      title: body.title,
      description: desc,
      status: 'pending',
      approved_feature_id: null,
      created_at: now,
      updated_at: now,
    })
  } catch (error: any) {
    return handleError('Create suggestion', error)
  }
}

/**
 * Get user's own suggestions
 * GET /api/suggestions
 * Headers: Authorization: Bearer <token>
 */
export async function handleGetMySuggestions(request: Request, env: Env): Promise<Response> {
  try {
    const { user, error } = await verifyUser(request, env)
    if (error) return error

    const results = await env.DB.prepare(`
      SELECT * FROM feature_suggestions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user!.id).all()

    return jsonResponse(results.results.map(mapRowToSuggestion))
  } catch (error: any) {
    return handleError('Get suggestions', error)
  }
}

/**
 * Get all suggestions (admin only)
 * GET /api/admin/suggestions
 * Headers: Authorization: Bearer <admin-token>
 */
export async function handleGetAllSuggestions(request: Request, env: Env): Promise<Response> {
  const authError = verifyAdmin(request, env)
  if (authError) return authError

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'

    const results = await env.DB.prepare(`
      SELECT s.*, u.email as user_email 
      FROM feature_suggestions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = ?
      ORDER BY s.created_at DESC
    `).bind(status).all()

    return jsonResponse(results.results.map(mapRowToSuggestion))
  } catch (error: any) {
    return handleError('Get all suggestions', error)
  }
}

/**
 * Approve suggestion and create feature
 * POST /api/admin/suggestions/:id/approve
 * Headers: Authorization: Bearer <admin-token>
 */
export async function handleApproveSuggestion(request: Request, env: Env): Promise<Response> {
  const authError = verifyAdmin(request, env)
  if (authError) return authError

  try {
    const suggestionId = extractSuggestionId(request)
    const idError = validateIdParam(suggestionId, 'Suggestion ID')
    if (idError) return idError

    const { suggestion, error: fetchError } = await getSuggestionById(env, suggestionId!)
    if (fetchError) return fetchError

    const feature = await createFeature(env, {
      title: { en: suggestion.title_en as string, vi: suggestion.title_vi as string },
      description: { en: suggestion.desc_en as string || '', vi: suggestion.desc_vi as string || '' },
    })

    await updateSuggestionStatus(env, suggestionId!, 'approved', feature.id)

    // Get user email to send notification
    const userResult = await env.DB.prepare('SELECT email FROM users WHERE id = ?')
      .bind(suggestion.user_id)
      .first()

    if (userResult && userResult.email) {
      try {
        const featureUrl = `${env.APP_URL}/#feature-${feature.id}`
        const emailContent = generateSuggestionApprovedEmail(
          suggestion.title_en as string,
          suggestion.title_vi as string,
          featureUrl
        )

        await sendEmail(env, {
          to: userResult.email as string,
          subject: '🎉 Your Feature Suggestion Has Been Approved!',
          html: emailContent.html,
          text: emailContent.text,
        })

        console.log(`✅ Approval email sent to ${userResult.email}`)
      } catch (emailError: any) {
        // Log error but don't fail the request
        console.error('Failed to send approval email:', emailError)
      }
    }

    return jsonResponse({ 
      success: true, 
      feature,
      message: 'Suggestion approved and feature created'
    })
  } catch (error: any) {
    return handleError('Approve suggestion', error)
  }
}

/**
 * Reject suggestion
 * POST /api/admin/suggestions/:id/reject
 * Headers: Authorization: Bearer <admin-token>
 */
export async function handleRejectSuggestion(request: Request, env: Env): Promise<Response> {
  const authError = verifyAdmin(request, env)
  if (authError) return authError

  try {
    const suggestionId = extractSuggestionId(request)
    const idError = validateIdParam(suggestionId, 'Suggestion ID')
    if (idError) return idError

    const { suggestion, error: fetchError } = await getSuggestionById(env, suggestionId!)
    if (fetchError) return fetchError

    await updateSuggestionStatus(env, suggestionId!, 'rejected')

    // Get user email to send notification
    const userResult = await env.DB.prepare('SELECT email FROM users WHERE id = ?')
      .bind(suggestion.user_id)
      .first()

    if (userResult && userResult.email) {
      try {
        const emailContent = generateSuggestionRejectedEmail(
          suggestion.title_en as string,
          suggestion.title_vi as string,
          env.APP_URL
        )

        await sendEmail(env, {
          to: userResult.email as string,
          subject: '📋 Update on Your Feature Suggestion',
          html: emailContent.html,
          text: emailContent.text,
        })

        console.log(`✅ Rejection email sent to ${userResult.email}`)
      } catch (emailError: any) {
        // Log error but don't fail the request
        console.error('Failed to send rejection email:', emailError)
      }
    }

    return jsonResponse({ 
      success: true,
      message: 'Suggestion rejected'
    })
  } catch (error: any) {
    return handleError('Reject suggestion', error)
  }
}
