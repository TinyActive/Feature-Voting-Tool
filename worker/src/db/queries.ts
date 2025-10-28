import { Env } from '../index'

export interface Feature {
  id: string
  title: { vi: string; en: string }
  description: { vi: string; en: string }
  votesUp: number
  votesDown: number
  createdAt: number
  updatedAt: number
}

export async function getAllFeatures(env: Env): Promise<Feature[]> {
  const { results } = await env.DB.prepare(`
    SELECT 
      f.id,
      f.title_en,
      f.title_vi,
      f.desc_en,
      f.desc_vi,
      f.created_at,
      f.updated_at,
      COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM features f
    LEFT JOIN votes v ON f.id = v.feature_id
    GROUP BY f.id
    ORDER BY (votes_up - votes_down) DESC, f.created_at DESC
  `).all()

  return results.map((row: any) => ({
    id: row.id,
    title: { en: row.title_en, vi: row.title_vi },
    description: { en: row.desc_en || '', vi: row.desc_vi || '' },
    votesUp: row.votes_up,
    votesDown: row.votes_down,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getFeatureById(env: Env, id: string): Promise<Feature | null> {
  const { results } = await env.DB.prepare(`
    SELECT 
      f.id,
      f.title_en,
      f.title_vi,
      f.desc_en,
      f.desc_vi,
      f.created_at,
      f.updated_at,
      COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM features f
    LEFT JOIN votes v ON f.id = v.feature_id
    WHERE f.id = ?
    GROUP BY f.id
  `).bind(id).all()

  if (results.length === 0) return null

  const row: any = results[0]
  return {
    id: row.id,
    title: { en: row.title_en, vi: row.title_vi },
    description: { en: row.desc_en || '', vi: row.desc_vi || '' },
    votesUp: row.votes_up,
    votesDown: row.votes_down,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createFeature(
  env: Env,
  data: { title: { en: string; vi: string }; description: { en: string; vi: string } }
): Promise<Feature> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await env.DB.prepare(`
    INSERT INTO features (id, title_en, title_vi, desc_en, desc_vi, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.title.en, data.title.vi, data.description.en, data.description.vi, now, now).run()

  return {
    id,
    title: data.title,
    description: data.description,
    votesUp: 0,
    votesDown: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export async function updateFeature(
  env: Env,
  id: string,
  data: Partial<{ title: { en: string; vi: string }; description: { en: string; vi: string } }>
): Promise<void> {
  const now = Date.now()
  const updates: string[] = []
  const bindings: any[] = []

  if (data.title) {
    updates.push('title_en = ?', 'title_vi = ?')
    bindings.push(data.title.en, data.title.vi)
  }

  if (data.description) {
    updates.push('desc_en = ?', 'desc_vi = ?')
    bindings.push(data.description.en, data.description.vi)
  }

  updates.push('updated_at = ?')
  bindings.push(now, id)

  await env.DB.prepare(`
    UPDATE features
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...bindings).run()
}

export async function deleteFeature(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM features WHERE id = ?').bind(id).run()
}

export async function recordVote(
  env: Env,
  featureId: string,
  fingerprint: string,
  voteType: 'up' | 'down'
): Promise<void> {
  const id = crypto.randomUUID()
  const now = Date.now()
  await env.DB.prepare(`
    INSERT INTO votes (id, feature_id, fingerprint, vote_type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, featureId, fingerprint, voteType, now).run()
}

export async function hasVotedToday(
  env: Env,
  featureId: string,
  fingerprint: string
): Promise<boolean> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const { results } = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM votes
    WHERE feature_id = ? AND fingerprint = ? AND created_at > ?
  `).bind(featureId, fingerprint, oneDayAgo).all()

  return (results[0] as any).count > 0
}
