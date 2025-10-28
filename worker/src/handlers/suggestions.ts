import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyUserSession } from './auth'
import { verifyAdminToken } from '../middleware/auth'
import { createFeature } from '../db/queries'

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
    const user = await verifyUserSession(request, env)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: any = await request.json()
    
    if (!body.title?.en || !body.title?.vi) {
      return new Response(JSON.stringify({ error: 'Title (en and vi) required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const id = crypto.randomUUID()
    const now = Date.now()

    await env.DB.prepare(`
      INSERT INTO feature_suggestions (id, user_id, title_en, title_vi, desc_en, desc_vi, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      id,
      user.id,
      body.title.en,
      body.title.vi,
      body.description?.en || '',
      body.description?.vi || '',
      now,
      now
    ).run()

    const suggestion: Suggestion = {
      id,
      user_id: user.id,
      title: body.title,
      description: body.description || { en: '', vi: '' },
      status: 'pending',
      approved_feature_id: null,
      created_at: now,
      updated_at: now,
    }

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Create suggestion error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to create suggestion' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Get user's own suggestions
 * GET /api/suggestions
 * Headers: Authorization: Bearer <token>
 */
export async function handleGetMySuggestions(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyUserSession(request, env)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = await env.DB.prepare(`
      SELECT * FROM feature_suggestions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all()

    const suggestions: Suggestion[] = results.results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      title: { en: row.title_en, vi: row.title_vi },
      description: { en: row.desc_en || '', vi: row.desc_vi || '' },
      status: row.status,
      approved_feature_id: row.approved_feature_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Get suggestions error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to get suggestions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Get all suggestions (admin only)
 * GET /api/admin/suggestions
 * Headers: Authorization: Bearer <admin-token>
 */
export async function handleGetAllSuggestions(request: Request, env: Env): Promise<Response> {
  const authResult = verifyAdminToken(request, env)
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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

    const suggestions: Suggestion[] = results.results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      title: { en: row.title_en, vi: row.title_vi },
      description: { en: row.desc_en || '', vi: row.desc_vi || '' },
      status: row.status,
      approved_feature_id: row.approved_feature_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_email: row.user_email,
    }))

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Get all suggestions error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to get suggestions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Approve suggestion and create feature
 * POST /api/admin/suggestions/:id/approve
 * Headers: Authorization: Bearer <admin-token>
 */
export async function handleApproveSuggestion(request: Request, env: Env): Promise<Response> {
  const authResult = verifyAdminToken(request, env)
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const url = new URL(request.url)
    const suggestionId = url.pathname.split('/')[4]

    if (!suggestionId) {
      return new Response(JSON.stringify({ error: 'Suggestion ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get suggestion
    const suggestion = await env.DB.prepare('SELECT * FROM feature_suggestions WHERE id = ?')
      .bind(suggestionId)
      .first()

    if (!suggestion) {
      return new Response(JSON.stringify({ error: 'Suggestion not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create feature
    const feature = await createFeature(env, {
      title: { en: suggestion.title_en as string, vi: suggestion.title_vi as string },
      description: { en: suggestion.desc_en as string || '', vi: suggestion.desc_vi as string || '' },
    })

    // Update suggestion status
    await env.DB.prepare(`
      UPDATE feature_suggestions 
      SET status = 'approved', approved_feature_id = ?, updated_at = ?
      WHERE id = ?
    `).bind(feature.id, Date.now(), suggestionId).run()

    return new Response(JSON.stringify({ 
      success: true, 
      feature,
      message: 'Suggestion approved and feature created'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Approve suggestion error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to approve suggestion' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Reject suggestion
 * POST /api/admin/suggestions/:id/reject
 * Headers: Authorization: Bearer <admin-token>
 */
export async function handleRejectSuggestion(request: Request, env: Env): Promise<Response> {
  const authResult = verifyAdminToken(request, env)
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const url = new URL(request.url)
    const suggestionId = url.pathname.split('/')[4]

    if (!suggestionId) {
      return new Response(JSON.stringify({ error: 'Suggestion ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await env.DB.prepare(`
      UPDATE feature_suggestions 
      SET status = 'rejected', updated_at = ?
      WHERE id = ?
    `).bind(Date.now(), suggestionId).run()

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Suggestion rejected'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Reject suggestion error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to reject suggestion' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
