// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.idea.nginxwaf.me'

export interface Feature {
  id: string
  title: { vi: string; en: string }
  description: { vi: string; en: string }
  votesUp: number
  votesDown: number
  createdAt: number
  updatedAt: number
}

export interface VoteRequest {
  voteType: 'up' | 'down'
  turnstileToken?: string
  recaptchaToken?: string
}

export interface Stats {
  totalFeatures: number
  totalVotes: number
  topFeature: Feature | null
}

// Public API
export async function getFeatures(): Promise<Feature[]> {
  const response = await fetch(`${API_BASE_URL}/api/features`)
  if (!response.ok) {
    throw new Error('Failed to fetch features')
  }
  return response.json()
}

export async function voteOnFeature(
  featureId: string,
  voteRequest: VoteRequest
): Promise<{ votesUp: number; votesDown: number }> {
  const response = await fetch(`${API_BASE_URL}/api/features/${featureId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(voteRequest),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to vote')
  }
  
  return response.json()
}

// Admin API
function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export async function createFeature(
  token: string,
  feature: Omit<Feature, 'id' | 'votesUp' | 'votesDown' | 'createdAt' | 'updatedAt'> & { recaptchaToken?: string }
): Promise<Feature> {
  const response = await fetch(`${API_BASE_URL}/api/admin/features`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(feature),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create feature')
  }
  
  return response.json()
}

export async function updateFeature(
  token: string,
  featureId: string,
  feature: Partial<Feature> & { recaptchaToken?: string }
): Promise<Feature> {
  const response = await fetch(`${API_BASE_URL}/api/admin/features/${featureId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(feature),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update feature')
  }
  
  return response.json()
}

export async function deleteFeature(token: string, featureId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/features/${featureId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete feature')
  }
}

export async function getStats(token: string): Promise<Stats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: getAuthHeaders(token),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }
  
  return response.json()
}
