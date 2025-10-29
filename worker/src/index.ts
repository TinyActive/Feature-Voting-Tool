import { handleFeatures, handleVote } from './handlers/features'
import { handleAdminFeatures, handleAdminStats } from './handlers/admin'
import { handleLoginRequest, handleVerifyToken, handleGetCurrentUser, handleLogout } from './handlers/auth'
import { handleCreateSuggestion, handleGetMySuggestions, handleGetAllSuggestions, handleApproveSuggestion, handleRejectSuggestion } from './handlers/suggestions'
import { handleGetComments, handleCreateComment, handleUpdateComment, handleDeleteComment } from './handlers/comments'
import { corsHeaders } from './utils/cors'

export interface Env {
  DB: D1Database
  RATE_LIMIT_KV?: KVNamespace // Optional - if not set, rate limiting is disabled
  ADMIN_TOKEN: string
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  TURNSTILE_SECRET_KEY?: string
  RESEND_API_KEY?: string
  SENDGRID_API_KEY?: string
  RECAPTCHA_SECRET_KEY: string
  RECAPTCHA_SITE_KEY: string
  APP_URL: string // e.g., https://idea.nginxwaf.me
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // Public endpoints
      if (path === '/api/features' && request.method === 'GET') {
        return await handleFeatures(request, env)
      }

      if (path.match(/^\/api\/features\/[^/]+\/vote$/) && request.method === 'POST') {
        return await handleVote(request, env, ctx)
      }

      // Admin endpoints
      if (path === '/api/admin/features' && request.method === 'POST') {
        return await handleAdminFeatures(request, env, 'create')
      }

      if (path.match(/^\/api\/admin\/features\/[^/]+$/) && request.method === 'PUT') {
        return await handleAdminFeatures(request, env, 'update')
      }

      if (path.match(/^\/api\/admin\/features\/[^/]+$/) && request.method === 'DELETE') {
        return await handleAdminFeatures(request, env, 'delete')
      }

      if (path === '/api/admin/stats' && request.method === 'GET') {
        return await handleAdminStats(request, env)
      }

      // Auth endpoints
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLoginRequest(request, env)
      }

      if (path === '/api/auth/verify' && request.method === 'GET') {
        return await handleVerifyToken(request, env)
      }

      if (path === '/api/auth/me' && request.method === 'GET') {
        return await handleGetCurrentUser(request, env)
      }

      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout(request, env)
      }

      // Suggestion endpoints
      if (path === '/api/suggestions' && request.method === 'POST') {
        return await handleCreateSuggestion(request, env)
      }

      if (path === '/api/suggestions' && request.method === 'GET') {
        return await handleGetMySuggestions(request, env)
      }

      if (path === '/api/admin/suggestions' && request.method === 'GET') {
        return await handleGetAllSuggestions(request, env)
      }

      if (path.match(/^\/api\/admin\/suggestions\/[^/]+\/approve$/) && request.method === 'POST') {
        return await handleApproveSuggestion(request, env)
      }

      if (path.match(/^\/api\/admin\/suggestions\/[^/]+\/reject$/) && request.method === 'POST') {
        return await handleRejectSuggestion(request, env)
      }

      // Comment endpoints
      if (path.match(/^\/api\/features\/[^/]+\/comments$/) && request.method === 'GET') {
        return await handleGetComments(request, env)
      }

      if (path.match(/^\/api\/features\/[^/]+\/comments$/) && request.method === 'POST') {
        return await handleCreateComment(request, env)
      }

      if (path.match(/^\/api\/comments\/[^/]+$/) && request.method === 'PUT') {
        return await handleUpdateComment(request, env)
      }

      if (path.match(/^\/api\/comments\/[^/]+$/) && request.method === 'DELETE') {
        return await handleDeleteComment(request, env)
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (error: any) {
      console.error('Error:', error)
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  },
}
