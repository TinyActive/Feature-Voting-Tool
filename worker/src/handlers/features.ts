import { Env } from '../index'
import { getAllFeatures, getFeatureById, recordVote, hasVotedToday } from '../db/queries'
import { corsHeaders } from '../utils/cors'
import { checkRateLimit } from '../middleware/rateLimit'
import { generateFingerprint } from '../utils/fingerprint'
import { sendTelegramNotification } from '../utils/telegram'

export async function handleFeatures(request: Request, env: Env): Promise<Response> {
  const features = await getAllFeatures(env)
  return new Response(JSON.stringify(features), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function handleVote(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const url = new URL(request.url)
    const featureId = url.pathname.split('/')[3]

    if (!featureId) {
      return new Response(JSON.stringify({ error: 'Feature ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const body: any = await request.json()
    const voteType = body.voteType

    if (!voteType || !['up', 'down'].includes(voteType)) {
      return new Response(JSON.stringify({ error: 'Invalid vote type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate fingerprint
    const fingerprint = await generateFingerprint(request)

    // Check if feature exists
    const feature = await getFeatureById(env, featureId)
    if (!feature) {
      return new Response(JSON.stringify({ error: 'Feature not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check existing vote
    const existingVote = await env.DB.prepare(`
      SELECT vote_type FROM votes 
      WHERE feature_id = ? AND fingerprint = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(featureId, fingerprint).first()

    if (existingVote) {
      const existingVoteType = existingVote.vote_type as 'up' | 'down'
      
      if (existingVoteType === voteType) {
        // Same vote - remove it (toggle off)
        await env.DB.prepare(`
          DELETE FROM votes 
          WHERE feature_id = ? AND fingerprint = ?
        `).bind(featureId, fingerprint).run()
      } else {
        // Different vote - update it
        await env.DB.prepare(`
          UPDATE votes 
          SET vote_type = ?, created_at = ?
          WHERE feature_id = ? AND fingerprint = ?
        `).bind(voteType, Date.now(), featureId, fingerprint).run()
      }
    } else {
      // No existing vote - create new one
      await recordVote(env, featureId, fingerprint, voteType)
    }

    // Get updated counts
    const updatedFeature = await getFeatureById(env, featureId)
    if (!updatedFeature) {
      throw new Error('Failed to fetch updated feature')
    }

    // Check for milestones and send notification
    const netVotes = updatedFeature.votesUp - updatedFeature.votesDown
    const milestones = [100, 500, 1000]
    if (milestones.includes(netVotes)) {
      ctx.waitUntil(
        sendTelegramNotification(
          env,
          `🎉 Feature "${updatedFeature.title.en}" has reached ${netVotes} net votes!`
        )
      )
    }

    return new Response(
      JSON.stringify({
        votesUp: updatedFeature.votesUp,
        votesDown: updatedFeature.votesDown,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Vote error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to process vote' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
