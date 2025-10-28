import { Env } from '../index'

const VOTES_PER_HOUR = 10
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

export async function checkRateLimit(
  env: Env,
  fingerprint: string
): Promise<{ allowed: boolean; remaining: number }> {
  // If KV is not configured, allow all requests (no rate limiting)
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true, remaining: VOTES_PER_HOUR }
  }

  const key = `ratelimit:${fingerprint}`
  const now = Date.now()

  // Get current vote count
  const data = await env.RATE_LIMIT_KV.get(key, 'json') as { votes: number[]; } | null

  if (!data) {
    // First vote
    await env.RATE_LIMIT_KV.put(
      key,
      JSON.stringify({ votes: [now] }),
      { expirationTtl: Math.ceil(WINDOW_MS / 1000) }
    )
    return { allowed: true, remaining: VOTES_PER_HOUR - 1 }
  }

  // Filter votes within the time window
  const recentVotes = data.votes.filter((timestamp: number) => now - timestamp < WINDOW_MS)

  if (recentVotes.length >= VOTES_PER_HOUR) {
    return { allowed: false, remaining: 0 }
  }

  // Add new vote
  recentVotes.push(now)
  await env.RATE_LIMIT_KV.put(
    key,
    JSON.stringify({ votes: recentVotes }),
    { expirationTtl: Math.ceil(WINDOW_MS / 1000) }
  )

  return { allowed: true, remaining: VOTES_PER_HOUR - recentVotes.length }
}
