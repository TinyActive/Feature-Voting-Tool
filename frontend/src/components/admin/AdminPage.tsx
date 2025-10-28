import { useEffect, useState } from 'react'
import { getFeatures, getStats, type Feature, type Stats } from '@/lib/api'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check for stored token
    const stored = sessionStorage.getItem('adminToken')
    if (stored) {
      setToken(stored)
    }
  }, [])

  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token])

  async function loadData() {
    if (!token) return
    
    try {
      setLoading(true)
      const [featuresData, statsData] = await Promise.all([
        getFeatures(),
        getStats(token),
      ])
      setFeatures(featuresData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      // If unauthorized, clear token
      if (err instanceof Error && err.message.includes('401')) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  function handleLogin(newToken: string) {
    sessionStorage.setItem('adminToken', newToken)
    setToken(newToken)
  }

  function handleLogout() {
    sessionStorage.removeItem('adminToken')
    setToken(null)
    setStats(null)
  }

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <AdminDashboard
      token={token}
      features={features}
      stats={stats}
      loading={loading}
      onLogout={handleLogout}
      onDataChange={loadData}
    />
  )
}
