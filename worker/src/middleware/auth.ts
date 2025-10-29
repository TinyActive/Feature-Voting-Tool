import { Env } from '../index'

export type UserRole = 'user' | 'moderator' | 'admin'
export type UserStatus = 'active' | 'banned'

export interface UserWithRole {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: UserStatus
}

// Check if email is in admin list
export async function isAdminEmail(email: string, env: Env): Promise<boolean> {
  const result = await env.DB.prepare('SELECT email FROM admin_emails WHERE email = ?')
    .bind(email)
    .first()
  return !!result
}

// Get user with role from session token
export async function getUserFromToken(token: string, env: Env): Promise<UserWithRole | null> {
  const session = await env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.status
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).bind(token, Date.now()).first()

  if (!session) return null

  return {
    id: session.id as string,
    email: session.email as string,
    name: session.name as string | null,
    role: (session.role as UserRole) || 'user',
    status: (session.status as UserStatus) || 'active',
  }
}

// Verify user has required role
export function hasRole(user: UserWithRole | null, requiredRole: UserRole): boolean {
  if (!user || user.status === 'banned') return false
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    moderator: 2,
    admin: 3,
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

// Middleware to verify admin access
export async function verifyAdminAccess(request: Request, env: Env): Promise<{ authorized: boolean; user?: UserWithRole }> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false }
  }

  const token = authHeader.substring(7)
  const user = await getUserFromToken(token, env)
  
  if (!user || !hasRole(user, 'admin')) {
    return { authorized: false }
  }

  return { authorized: true, user }
}

// Middleware to verify moderator access
export async function verifyModeratorAccess(request: Request, env: Env): Promise<{ authorized: boolean; user?: UserWithRole }> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false }
  }

  const token = authHeader.substring(7)
  const user = await getUserFromToken(token, env)
  
  if (!user || !hasRole(user, 'moderator')) {
    return { authorized: false }
  }

  return { authorized: true, user }
}

// Legacy function for backward compatibility (deprecated)
export function verifyAdminToken(request: Request, env: Env): { authorized: boolean; token?: string } {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false }
  }

  const token = authHeader.substring(7)
  return { authorized: token === env.ADMIN_TOKEN, token }
}

// Legacy function (deprecated)
export function isAdminToken(token: string, env: Env): boolean {
  return token === env.ADMIN_TOKEN
}

// Log admin action to audit log
export async function logAuditAction(
  env: Env,
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
): Promise<void> {
  const id = crypto.randomUUID()
  await env.DB.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    userId,
    action,
    targetType,
    targetId,
    details ? JSON.stringify(details) : null,
    Date.now()
  ).run()
}
