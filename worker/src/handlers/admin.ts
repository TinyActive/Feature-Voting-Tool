import { Env } from '../index'
import {
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature,
} from '../db/queries'
import { corsHeaders } from '../utils/cors'
import { verifyAdminToken } from '../middleware/auth'
import { sendTelegramNotification } from '../utils/telegram'
import { verifyRecaptcha } from '../utils/recaptcha'

export async function handleAdminFeatures(
  request: Request,
  env: Env,
  action: 'create' | 'update' | 'delete'
): Promise<Response> {
  // Verify admin token
  const authResult = verifyAdminToken(request, env)
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    if (action === 'create') {
      const body: any = await request.json()
      
      // Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(body.recaptchaToken, env, 'admin_create_feature')
      if (!recaptchaResult.success) {
        return new Response(JSON.stringify({ error: recaptchaResult.error || 'Security verification failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      if (!body.title?.en || !body.title?.vi) {
        return new Response(JSON.stringify({ error: 'Title (en and vi) required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const feature = await createFeature(env, {
        title: body.title,
        description: body.description || { en: '', vi: '' },
      })

      // Send notification
      await sendTelegramNotification(
        env,
        `✨ New feature added: "${feature.title.en}"`
      )

      return new Response(JSON.stringify(feature), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update') {
      const url = new URL(request.url)
      const featureId = url.pathname.split('/').pop()

      if (!featureId) {
        return new Response(JSON.stringify({ error: 'Feature ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const body: any = await request.json()
      
      // Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(body.recaptchaToken, env, 'admin_update_feature')
      if (!recaptchaResult.success) {
        return new Response(JSON.stringify({ error: recaptchaResult.error || 'Security verification failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      await updateFeature(env, featureId, body)

      const updated = await getFeatureById(env, featureId)
      return new Response(JSON.stringify(updated), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      const url = new URL(request.url)
      const featureId = url.pathname.split('/').pop()

      if (!featureId) {
        return new Response(JSON.stringify({ error: 'Feature ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await deleteFeature(env, featureId)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Admin action error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  // Verify admin token
  const authResult = verifyAdminToken(request, env)
  if (!authResult.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const features = await getAllFeatures(env)

    const totalFeatures = features.length
    const totalVotes = features.reduce((sum, f) => sum + f.votesUp + f.votesDown, 0)
    const topFeature = features.length > 0 ? features[0] : null

    return new Response(
      JSON.stringify({
        totalFeatures,
        totalVotes,
        topFeature,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Stats error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch stats' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
