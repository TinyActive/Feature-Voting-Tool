import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyUserSession } from './auth'

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
    const url = new URL(request.url)
    const featureId = url.pathname.split('/')[3]

    if (!featureId) {
      return new Response(JSON.stringify({ error: 'Feature ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all comments with user info
    const results = await env.DB.prepare(`
      SELECT c.*, u.email as user_email, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.feature_id = ?
      ORDER BY c.created_at ASC
    `).bind(featureId).all()

    const comments: Comment[] = results.results.map((row: any) => ({
      id: row.id,
      feature_id: row.feature_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.user_name,
      user_email: row.user_email,
    }))

    // Organize into tree structure
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

    return new Response(JSON.stringify(rootComments), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Get comments error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to get comments' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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
    const user = await verifyUserSession(request, env)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const featureId = url.pathname.split('/')[3]

    if (!featureId) {
      return new Response(JSON.stringify({ error: 'Feature ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: any = await request.json()
    
    if (!body.content || body.content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.content.length > 2000) {
      return new Response(JSON.stringify({ error: 'Content too long (max 2000 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const id = crypto.randomUUID()
    const now = Date.now()

    await env.DB.prepare(`
      INSERT INTO comments (id, feature_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      featureId,
      user.id,
      body.content.trim(),
      body.parent_id || null,
      now,
      now
    ).run()

    const comment: Comment = {
      id,
      feature_id: featureId,
      user_id: user.id,
      content: body.content.trim(),
      parent_id: body.parent_id || null,
      created_at: now,
      updated_at: now,
      user_name: user.name || undefined,
      user_email: user.email,
    }

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Create comment error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to create comment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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
    const user = await verifyUserSession(request, env)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const commentId = url.pathname.split('/')[3]

    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if comment exists and belongs to user
    const comment = await env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .first()

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (comment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: any = await request.json()
    
    if (!body.content || body.content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Content required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await env.DB.prepare(`
      UPDATE comments 
      SET content = ?, updated_at = ?
      WHERE id = ?
    `).bind(body.content.trim(), Date.now(), commentId).run()

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Comment updated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Update comment error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to update comment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Delete a comment (own comments only)
 * DELETE /api/comments/:id
 * Headers: Authorization: Bearer <token>
 */
export async function handleDeleteComment(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyUserSession(request, env)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const commentId = url.pathname.split('/')[3]

    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if comment exists and belongs to user
    const comment = await env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .first()

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (comment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete comment (cascade will delete replies)
    await env.DB.prepare('DELETE FROM comments WHERE id = ?')
      .bind(commentId)
      .run()

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Comment deleted'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Delete comment error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to delete comment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
