import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyUserSession } from './auth'
import { verifyRecaptcha } from '../utils/recaptcha'

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

function extractIdFromPath(request: Request, position: number): string | null {
  const url = new URL(request.url)
  return url.pathname.split('/')[position] || null
}

function mapRowToComment(row: any): Comment {
  return {
    id: row.id,
    feature_id: row.feature_id,
    user_id: row.user_id,
    content: row.content,
    parent_id: row.parent_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(row.user_name && { user_name: row.user_name }),
    ...(row.user_email && { user_email: row.user_email }),
  }
}

async function verifyCommentOwnership(
  env: Env,
  commentId: string,
  userId: string
): Promise<{ comment: any; error: Response | null }> {
  const comment = await env.DB.prepare('SELECT * FROM comments WHERE id = ?')
    .bind(commentId)
    .first()

  if (!comment) {
    return { comment: null, error: jsonResponse({ error: 'Comment not found' }, 404) }
  }

  if (comment.user_id !== userId) {
    return { comment: null, error: jsonResponse({ error: 'Forbidden' }, 403) }
  }

  return { comment, error: null }
}

function validateContent(content: string, maxLength = 2000): Response | null {
  if (!content || content.trim().length === 0) {
    return jsonResponse({ error: 'Content required' }, 400)
  }
  if (content.length > maxLength) {
    return jsonResponse({ error: `Content too long (max ${maxLength} characters)` }, 400)
  }
  return null
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

async function verifyUserAndCommentOwnership(
  request: Request,
  env: Env
): Promise<{ user: any; commentId: string; error: Response | null }> {
  const { user, error: authError } = await verifyUser(request, env)
  if (authError) return { user: null, commentId: '', error: authError }

  const commentId = extractIdFromPath(request, 3)
  const idError = validateIdParam(commentId, 'Comment ID')
  if (idError) return { user: null, commentId: '', error: idError }

  const { error: ownershipError } = await verifyCommentOwnership(env, commentId!, user!.id)
  if (ownershipError) return { user: null, commentId: '', error: ownershipError }

  return { user, commentId: commentId!, error: null }
}

function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  comments.forEach(comment => {
    comment.replies = []
    commentMap.set(comment.id, comment)
  })

  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies!.push(comment)
      }
    } else {
      rootComments.push(comment)
    }
  })

  return rootComments
}

interface Comment {
  id: string
  feature_id: string
  user_id: string
  content: string
  parent_id: string | null
  created_at: number
  updated_at: number
  user_name?: string
  user_email?: string
  replies?: Comment[]
}

/**
 * Get comments for a feature
 * GET /api/features/:id/comments
 */
export async function handleGetComments(request: Request, env: Env): Promise<Response> {
  try {
    const featureId = extractIdFromPath(request, 3)
    const idError = validateIdParam(featureId, 'Feature ID')
    if (idError) return idError

    const results = await env.DB.prepare(`
      SELECT c.*, u.email as user_email, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.feature_id = ?
      ORDER BY c.created_at ASC
    `).bind(featureId).all()

    const comments: Comment[] = results.results.map(mapRowToComment)
    return jsonResponse(buildCommentTree(comments))
  } catch (error: any) {
    return handleError('Get comments', error)
  }
}

/**
 * Create a comment
 * POST /api/features/:id/comments
 * Headers: Authorization: Bearer <token>
 * Body: { content: string, parent_id?: string }
 */
export async function handleCreateComment(request: Request, env: Env): Promise<Response> {
  try {
    const { user, error } = await verifyUser(request, env)
    if (error) return error

    const featureId = extractIdFromPath(request, 3)
    const idError = validateIdParam(featureId, 'Feature ID')
    if (idError) return idError

    const body: any = await request.json()
    
    const recaptchaError = await verifyRecaptchaToken(body.recaptchaToken, env, 'create_comment')
    if (recaptchaError) return recaptchaError
    
    const contentError = validateContent(body.content)
    if (contentError) return contentError

    const id = crypto.randomUUID()
    const now = Date.now()
    const trimmedContent = body.content.trim()

    await env.DB.prepare(`
      INSERT INTO comments (id, feature_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, featureId, user!.id, trimmedContent, body.parent_id || null, now, now).run()

    return jsonResponse({
      id,
      feature_id: featureId,
      user_id: user!.id,
      content: trimmedContent,
      parent_id: body.parent_id || null,
      created_at: now,
      updated_at: now,
      user_name: user!.name || undefined,
      user_email: user!.email,
    }, 201)
  } catch (error: any) {
    return handleError('Create comment', error)
  }
}

/**
 * Update a comment (own comments only)
 * PUT /api/comments/:id
 * Headers: Authorization: Bearer <token>
 * Body: { content: string }
 */
export async function handleUpdateComment(request: Request, env: Env): Promise<Response> {
  try {
    const { commentId, error } = await verifyUserAndCommentOwnership(request, env)
    if (error) return error

    const body: any = await request.json()
    const contentError = validateContent(body.content)
    if (contentError) return contentError

    await env.DB.prepare(`
      UPDATE comments SET content = ?, updated_at = ? WHERE id = ?
    `).bind(body.content.trim(), Date.now(), commentId).run()

    return jsonResponse({ success: true, message: 'Comment updated' })
  } catch (error: any) {
    return handleError('Update comment', error)
  }
}

/**
 * Delete a comment (own comments only)
 * DELETE /api/comments/:id
 * Headers: Authorization: Bearer <token>
 */
export async function handleDeleteComment(request: Request, env: Env): Promise<Response> {
  try {
    const { commentId, error } = await verifyUserAndCommentOwnership(request, env)
    if (error) return error

    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run()

    return jsonResponse({ success: true, message: 'Comment deleted' })
  } catch (error: any) {
    return handleError('Delete comment', error)
  }
}
