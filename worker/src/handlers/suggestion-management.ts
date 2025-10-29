import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyAdminAccess, logAuditAction } from '../middleware/auth'
import { createFeature } from '../db/queries'
import { sendEmail, generateSuggestionApprovedEmail, generateSuggestionRejectedEmail } from '../utils/email'

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Get all suggestions for admin review (admin only)
 * GET /api/admin/suggestions
 */
export async function handleGetAllSuggestions(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const status = url.searchParams.get('status')

    let query = `
      SELECT s.*, u.email as user_email, u.name as user_name
      FROM feature_suggestions s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND s.status = ?'
      params.push(status)
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?'
    params.push(perPage, (page - 1) * perPage)

    const result = await env.DB.prepare(query).bind(...params).all()

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM feature_suggestions WHERE 1=1'
    const countParams: any[] = []
    if (status) {
      countQuery += ' AND status = ?'
      countParams.push(status)
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first()
    const total = (countResult?.count as number) || 0

    // Map results
    const suggestions = result.results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_email: row.user_email,
      user_name: row.user_name,
      title: { en: row.title_en, vi: row.title_vi },
      description: { en: row.desc_en || '', vi: row.desc_vi || '' },
      status: row.status,
      approved_feature_id: row.approved_feature_id,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return jsonResponse({
      suggestions,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error: any) {
    console.error('Get all suggestions error:', error)
    return jsonResponse({ error: error.message || 'Failed to get suggestions' }, 500)
  }
}

/**
 * Approve suggestion and create feature (admin only)
 * POST /api/admin/suggestions/:id/approve
 */
export async function handleApproveSuggestion(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const suggestionId = url.pathname.split('/')[4]

    if (!suggestionId) {
      return jsonResponse({ error: 'Suggestion ID required' }, 400)
    }

    // Get suggestion
    const suggestion = await env.DB.prepare('SELECT * FROM feature_suggestions WHERE id = ?')
      .bind(suggestionId)
      .first()

    if (!suggestion) {
      return jsonResponse({ error: 'Suggestion not found' }, 404)
    }

    if (suggestion.status !== 'pending') {
      return jsonResponse({ error: 'Suggestion already reviewed' }, 400)
    }

    // Create feature from suggestion
    const feature = await createFeature(env, {
      title: {
        en: typeof suggestion.title_en === 'string' ? suggestion.title_en : String(suggestion.title_en ?? ''),
        vi: typeof suggestion.title_vi === 'string' ? suggestion.title_vi : String(suggestion.title_vi ?? ''),
      },
      description: {
        en: typeof suggestion.desc_en === 'string' ? suggestion.desc_en : String(suggestion.desc_en ?? ''),
        vi: typeof suggestion.desc_vi === 'string' ? suggestion.desc_vi : String(suggestion.desc_vi ?? ''),
      },
    })

    // Update suggestion status
    await env.DB.prepare(`
      UPDATE feature_suggestions
      SET status = 'approved', approved_feature_id = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(feature.id, user!.id, Date.now(), Date.now(), suggestionId).run()

    // Get user email for notification
    const userRecord = await env.DB.prepare('SELECT email FROM users WHERE id = ?')
      .bind(suggestion.user_id)
      .first()

    if (userRecord) {
      try {
        const { html, text } = generateSuggestionApprovedEmail(
          typeof suggestion.title_en === 'string' ? suggestion.title_en : String(suggestion.title_en ?? ''),
          typeof suggestion.title_vi === 'string' ? suggestion.title_vi : String(suggestion.title_vi ?? ''),
          `${env.APP_URL}/features/${feature.id}`
        )
        await sendEmail(env, {
          to: userRecord.email as string,
          subject: 'Your feature suggestion was approved!',
          html,
          text,
        })
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
      }
    }

    // Log audit action
    await logAuditAction(env, user!.id, 'approve_suggestion', 'suggestion', suggestionId, {
      featureId: feature.id,
    })

    return jsonResponse({
      success: true,
      message: 'Suggestion approved',
      feature,
    })
  } catch (error: any) {
    console.error('Approve suggestion error:', error)
    return jsonResponse({ error: error.message || 'Failed to approve suggestion' }, 500)
  }
}

/**
 * Reject suggestion (admin only)
 * POST /api/admin/suggestions/:id/reject
 * Body: { reason?: string }
 */
export async function handleRejectSuggestion(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const suggestionId = url.pathname.split('/')[4]

    if (!suggestionId) {
      return jsonResponse({ error: 'Suggestion ID required' }, 400)
    }

    const body: any = await request.json().catch(() => ({}))
    const reason = body.reason || 'Does not meet our criteria'

    // Get suggestion
    const suggestion = await env.DB.prepare('SELECT * FROM feature_suggestions WHERE id = ?')
      .bind(suggestionId)
      .first()

    if (!suggestion) {
      return jsonResponse({ error: 'Suggestion not found' }, 404)
    }

    if (suggestion.status !== 'pending') {
      return jsonResponse({ error: 'Suggestion already reviewed' }, 400)
    }

    // Update suggestion status
    await env.DB.prepare(`
      UPDATE feature_suggestions
      SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(user!.id, Date.now(), Date.now(), suggestionId).run()

    // Get user email for notification
    const userRecord = await env.DB.prepare('SELECT email FROM users WHERE id = ?')
      .bind(suggestion.user_id)
      .first()

    if (userRecord) {
      try {
        const { html, text } = generateSuggestionRejectedEmail(
          typeof suggestion.title_en === 'string' ? suggestion.title_en : String(suggestion.title_en ?? ''),
          typeof suggestion.title_vi === 'string' ? suggestion.title_vi : String(suggestion.title_vi ?? ''),
          env.APP_URL
        )
        await sendEmail(env, {
          to: userRecord.email as string,
          subject: 'Update on your feature suggestion',
          html,
          text,
        })
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError)
      }
    }

    // Log audit action
    await logAuditAction(env, user!.id, 'reject_suggestion', 'suggestion', suggestionId, { reason })

    return jsonResponse({
      success: true,
      message: 'Suggestion rejected',
    })
  } catch (error: any) {
    console.error('Reject suggestion error:', error)
    return jsonResponse({ error: error.message || 'Failed to reject suggestion' }, 500)
  }
}

/**
 * Get suggestion statistics (admin only)
 * GET /api/admin/suggestions/stats
 */
export async function handleGetSuggestionStats(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const totalSuggestions = await env.DB.prepare('SELECT COUNT(*) as count FROM feature_suggestions').first()
    const pendingSuggestions = await env.DB.prepare("SELECT COUNT(*) as count FROM feature_suggestions WHERE status = 'pending'").first()
    const approvedSuggestions = await env.DB.prepare("SELECT COUNT(*) as count FROM feature_suggestions WHERE status = 'approved'").first()
    const rejectedSuggestions = await env.DB.prepare("SELECT COUNT(*) as count FROM feature_suggestions WHERE status = 'rejected'").first()

    return jsonResponse({
      total: totalSuggestions?.count || 0,
      pending: pendingSuggestions?.count || 0,
      approved: approvedSuggestions?.count || 0,
      rejected: rejectedSuggestions?.count || 0,
    })
  } catch (error: any) {
    console.error('Get suggestion stats error:', error)
    return jsonResponse({ error: error.message || 'Failed to get suggestion stats' }, 500)
  }
}

/**
 * Delete suggestion permanently (admin only)
 * DELETE /api/admin/suggestions/:id
 */
export async function handleDeleteSuggestion(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const suggestionId = url.pathname.split('/')[4]

    if (!suggestionId) {
      return jsonResponse({ error: 'Suggestion ID required' }, 400)
    }

    // Log audit action before deletion
    await logAuditAction(env, user!.id, 'delete_suggestion', 'suggestion', suggestionId)

    await env.DB.prepare('DELETE FROM feature_suggestions WHERE id = ?')
      .bind(suggestionId)
      .run()

    return jsonResponse({ success: true, message: 'Suggestion deleted permanently' })
  } catch (error: any) {
    console.error('Delete suggestion error:', error)
    return jsonResponse({ error: error.message || 'Failed to delete suggestion' }, 500)
  }
}
