import { useEffect, useState } from 'react'
import { getFeatures, getStats, type Feature, type Stats } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const { logout: logoutUser } = useAuth()

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

  async function handleLogin(newToken: string) {
    // First verify admin token and logout all users
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Invalid admin token')
      }

      // Logout current user if logged in
      logoutUser()

      // Store admin token
      sessionStorage.setItem('adminToken', newToken)
      setToken(newToken)
    } catch (error) {
      console.error('Admin login failed:', error)
      throw error
    }
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
