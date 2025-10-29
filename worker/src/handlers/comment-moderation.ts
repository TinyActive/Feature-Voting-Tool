import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyModeratorAccess, logAuditAction } from '../middleware/auth'

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Get all comments for moderation (moderator/admin only)
 * GET /api/admin/comments
 */
export async function handleGetAllComments(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized } = await verifyModeratorAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const status = url.searchParams.get('status')
    const featureId = url.searchParams.get('feature_id')

    let query = `
      SELECT c.*, u.email as user_email, u.name as user_name, u.role as user_role,
             f.title_en as feature_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN features f ON c.feature_id = f.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND c.status = ?'
      params.push(status)
    }

    if (featureId) {
      query += ' AND c.feature_id = ?'
      params.push(featureId)
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(perPage, (page - 1) * perPage)

    const result = await env.DB.prepare(query).bind(...params).all()

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM comments c WHERE 1=1'
    const countParams: any[] = []
    if (status) {
      countQuery += ' AND c.status = ?'
      countParams.push(status)
    }
    if (featureId) {
      countQuery += ' AND c.feature_id = ?'
      countParams.push(featureId)
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first()
    const total = (countResult?.count as number) || 0

    return jsonResponse({
      comments: result.results,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error: any) {
    console.error('Get all comments error:', error)
    return jsonResponse({ error: error.message || 'Failed to get comments' }, 500)
  }
}

/**
 * Update comment status (moderator/admin only)
 * PUT /api/admin/comments/:id/status
 * Body: { status: 'active' | 'hidden' | 'deleted' }
 */
export async function handleUpdateCommentStatus(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user } = await verifyModeratorAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const commentId = url.pathname.split('/')[4]

    if (!commentId) {
      return jsonResponse({ error: 'Comment ID required' }, 400)
    }

    const body: any = await request.json()
    const newStatus = body.status

    if (!['active', 'hidden', 'deleted'].includes(newStatus)) {
      return jsonResponse({ error: 'Invalid status' }, 400)
    }

    await env.DB.prepare(`
      UPDATE comments 
      SET status = ?, moderated_by = ?, moderated_at = ?
      WHERE id = ?
    `).bind(newStatus, user!.id, Date.now(), commentId).run()

    // Log audit action
    await logAuditAction(env, user!.id, `${newStatus}_comment`, 'comment', commentId, { newStatus })

    return jsonResponse({ success: true, message: `Comment ${newStatus}` })
  } catch (error: any) {
    console.error('Update comment status error:', error)
    return jsonResponse({ error: error.message || 'Failed to update comment status' }, 500)
  }
}

/**
 * Delete comment permanently (admin only)
 * DELETE /api/admin/comments/:id
 */
export async function handleDeleteCommentPermanently(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user } = await verifyModeratorAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const commentId = url.pathname.split('/')[4]

    if (!commentId) {
      return jsonResponse({ error: 'Comment ID required' }, 400)
    }

    // Log audit action before deletion
    await logAuditAction(env, user!.id, 'delete_comment_permanent', 'comment', commentId)

    await env.DB.prepare('DELETE FROM comments WHERE id = ?')
      .bind(commentId)
      .run()

    return jsonResponse({ success: true, message: 'Comment deleted permanently' })
  } catch (error: any) {
    console.error('Delete comment error:', error)
    return jsonResponse({ error: error.message || 'Failed to delete comment' }, 500)
  }
}

/**
 * Get comment statistics (moderator/admin only)
 * GET /api/admin/comments/stats
 */
export async function handleGetCommentStats(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized } = await verifyModeratorAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const totalComments = await env.DB.prepare('SELECT COUNT(*) as count FROM comments').first()
    const activeComments = await env.DB.prepare("SELECT COUNT(*) as count FROM comments WHERE status = 'active'").first()
    const hiddenComments = await env.DB.prepare("SELECT COUNT(*) as count FROM comments WHERE status = 'hidden'").first()
    const deletedComments = await env.DB.prepare("SELECT COUNT(*) as count FROM comments WHERE status = 'deleted'").first()

    return jsonResponse({
      total: totalComments?.count || 0,
      active: activeComments?.count || 0,
      hidden: hiddenComments?.count || 0,
      deleted: deletedComments?.count || 0,
    })
  } catch (error: any) {
    console.error('Get comment stats error:', error)
    return jsonResponse({ error: error.message || 'Failed to get comment stats' }, 500)
  }
}
