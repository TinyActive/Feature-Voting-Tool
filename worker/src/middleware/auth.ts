import { Env } from '../index'

export function verifyAdminToken(request: Request, env: Env): { authorized: boolean } {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false }
  }

  const token = authHeader.substring(7)
  return { authorized: token === env.ADMIN_TOKEN }
}
