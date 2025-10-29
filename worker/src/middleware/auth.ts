import { Env } from '../index'

export function verifyAdminToken(request: Request, env: Env): { authorized: boolean; token?: string } {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false }
  }

  const token = authHeader.substring(7)
  return { authorized: token === env.ADMIN_TOKEN, token }
}

export function isAdminToken(token: string, env: Env): boolean {
  return token === env.ADMIN_TOKEN
}

// Delete all user sessions (called when admin logs in)
export async function deleteAllUserSessions(env: Env): Promise<void> {
  await env.DB.prepare('DELETE FROM user_sessions').run()
}
