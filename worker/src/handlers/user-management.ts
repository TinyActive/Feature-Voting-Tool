import { Env } from '../index'
import { corsHeaders } from '../utils/cors'
import { verifyAdminAccess, UserRole, logAuditAction } from '../middleware/auth'

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
export async function handleGetUsers(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    let query = 'SELECT * FROM users WHERE 1=1'
    const params: any[] = []

    if (role) {
      query += ' AND role = ?'
      params.push(role)
    }

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (search) {
      query += ' AND (email LIKE ? OR name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(perPage, (page - 1) * perPage)

    const result = await env.DB.prepare(query).bind(...params).all()

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1'
    const countParams: any[] = []
    if (role) {
      countQuery += ' AND role = ?'
      countParams.push(role)
    }
    if (status) {
      countQuery += ' AND status = ?'
      countParams.push(status)
    }
    if (search) {
      countQuery += ' AND (email LIKE ? OR name LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`)
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first()
    const total = (countResult?.count as number) || 0

    return jsonResponse({
      users: result.results,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return jsonResponse({ error: error.message || 'Failed to get users' }, 500)
  }
}

/**
 * Update user role (admin only)
 * PUT /api/admin/users/:id/role
 * Body: { role: 'user' | 'moderator' | 'admin' }
 */
export async function handleUpdateUserRole(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user: adminUser } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const userId = url.pathname.split('/')[4]

    if (!userId) {
      return jsonResponse({ error: 'User ID required' }, 400)
    }

    const body: any = await request.json()
    const newRole = body.role as UserRole

    if (!['user', 'moderator', 'admin'].includes(newRole)) {
      return jsonResponse({ error: 'Invalid role' }, 400)
    }

    // Prevent admin from demoting themselves
    if (userId === adminUser!.id && newRole !== 'admin') {
      return jsonResponse({ error: 'Cannot change your own role' }, 400)
    }

    await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
      .bind(newRole, userId)
      .run()

    // Log audit action
    await logAuditAction(env, adminUser!.id, 'change_role', 'user', userId, { newRole })

    return jsonResponse({ success: true, message: 'User role updated' })
  } catch (error: any) {
    console.error('Update user role error:', error)
    return jsonResponse({ error: error.message || 'Failed to update user role' }, 500)
  }
}

/**
 * Ban/Unban user (admin only)
 * PUT /api/admin/users/:id/status
 * Body: { status: 'active' | 'banned' }
 */
export async function handleUpdateUserStatus(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user: adminUser } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const userId = url.pathname.split('/')[4]

    if (!userId) {
      return jsonResponse({ error: 'User ID required' }, 400)
    }

    const body: any = await request.json()
    const newStatus = body.status

    if (!['active', 'banned'].includes(newStatus)) {
      return jsonResponse({ error: 'Invalid status' }, 400)
    }

    // Prevent admin from banning themselves
    if (userId === adminUser!.id) {
      return jsonResponse({ error: 'Cannot change your own status' }, 400)
    }

    await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?')
      .bind(newStatus, userId)
      .run()

    // If banning, delete all user sessions
    if (newStatus === 'banned') {
      await env.DB.prepare('DELETE FROM user_sessions WHERE user_id = ?')
        .bind(userId)
        .run()
    }

    // Log audit action
    await logAuditAction(env, adminUser!.id, newStatus === 'banned' ? 'ban_user' : 'unban_user', 'user', userId)

    return jsonResponse({ success: true, message: `User ${newStatus}` })
  } catch (error: any) {
    console.error('Update user status error:', error)
    return jsonResponse({ error: error.message || 'Failed to update user status' }, 500)
  }
}

/**
 * Add admin email (admin only)
 * POST /api/admin/admin-emails
 * Body: { email: string }
 */
export async function handleAddAdminEmail(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user: adminUser } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body: any = await request.json()
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return jsonResponse({ error: 'Email required' }, 400)
    }

    // Check if already exists
    const existing = await env.DB.prepare('SELECT email FROM admin_emails WHERE email = ?')
      .bind(email)
      .first()

    if (existing) {
      return jsonResponse({ error: 'Email already in admin list' }, 400)
    }

    await env.DB.prepare(`
      INSERT INTO admin_emails (email, added_at, added_by)
      VALUES (?, ?, ?)
    `).bind(email, Date.now(), adminUser!.id).run()

    // Log audit action
    await logAuditAction(env, adminUser!.id, 'add_admin_email', 'admin_email', email)

    return jsonResponse({ success: true, message: 'Admin email added' })
  } catch (error: any) {
    console.error('Add admin email error:', error)
    return jsonResponse({ error: error.message || 'Failed to add admin email' }, 500)
  }
}

/**
 * Remove admin email (admin only)
 * DELETE /api/admin/admin-emails/:email
 */
export async function handleRemoveAdminEmail(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized, user: adminUser } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    const email = decodeURIComponent(url.pathname.split('/').pop() || '')

    if (!email) {
      return jsonResponse({ error: 'Email required' }, 400)
    }

    // Prevent removing own email if they're the last admin
    const adminCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?')
      .bind('admin')
      .first()

    if ((adminCount?.count as number) <= 1 && email === adminUser!.email) {
      return jsonResponse({ error: 'Cannot remove last admin email' }, 400)
    }

    await env.DB.prepare('DELETE FROM admin_emails WHERE email = ?')
      .bind(email)
      .run()

    // Log audit action
    await logAuditAction(env, adminUser!.id, 'remove_admin_email', 'admin_email', email)

    return jsonResponse({ success: true, message: 'Admin email removed' })
  } catch (error: any) {
    console.error('Remove admin email error:', error)
    return jsonResponse({ error: error.message || 'Failed to remove admin email' }, 500)
  }
}

/**
 * Get admin emails list (admin only)
 * GET /api/admin/admin-emails
 */
export async function handleGetAdminEmails(request: Request, env: Env): Promise<Response> {
  try {
    const { authorized } = await verifyAdminAccess(request, env)
    if (!authorized) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const result = await env.DB.prepare('SELECT * FROM admin_emails ORDER BY added_at DESC').all()

    return jsonResponse({ emails: result.results })
  } catch (error: any) {
    console.error('Get admin emails error:', error)
    return jsonResponse({ error: error.message || 'Failed to get admin emails' }, 500)
  }
}
