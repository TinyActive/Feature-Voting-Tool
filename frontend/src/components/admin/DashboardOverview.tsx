import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Users,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface Stats {
  totalFeatures: number
  totalVotes: number
  topFeature: any
}

interface DashboardData {
  users: {
    total: number
    admins: number
    moderators: number
    banned: number
    recentUsers: any[]
  }
  comments: {
    total: number
    active: number
    hidden: number
    deleted: number
  }
  suggestions: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  features: {
    total: number
    totalVotes: number
    topFeature: any
  }
}

export default function DashboardOverview() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    users: {
      total: 0,
      admins: 0,
      moderators: 0,
      banned: 0,
      recentUsers: [],
    },
    comments: {
      total: 0,
      active: 0,
      hidden: 0,
      deleted: 0,
    },
    suggestions: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    features: {
      total: 0,
      totalVotes: 0,
      topFeature: null,
    },
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Load stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
        setDashboardData((prev) => ({
          ...prev,
          features: {
            total: statsData.totalFeatures || 0,
            totalVotes: statsData.totalVotes || 0,
            topFeature: statsData.topFeature,
          },
        }))
      }

      // Load users
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const users = usersData.users || []
        setDashboardData((prev) => ({
          ...prev,
          users: {
            total: users.length,
            admins: users.filter((u: any) => u.role === 'admin').length,
            moderators: users.filter((u: any) => u.role === 'moderator').length,
            banned: users.filter((u: any) => u.status === 'banned').length,
            recentUsers: users.slice(0, 5),
          },
        }))
      }

      // Load comments
      const commentsResponse = await fetch(`${API_BASE_URL}/api/admin/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        const comments = commentsData.comments || []
        setDashboardData((prev) => ({
          ...prev,
          comments: {
            total: comments.length,
            active: comments.filter((c: any) => c.status === 'active').length,
            hidden: comments.filter((c: any) => c.status === 'hidden').length,
            deleted: comments.filter((c: any) => c.status === 'deleted').length,
          },
        }))
      }

      // Load suggestions
      const suggestionsResponse = await fetch(
        `${API_BASE_URL}/api/admin/suggestions?status=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json()
        const suggestions = suggestionsData || []
        setDashboardData((prev) => ({
          ...prev,
          suggestions: {
            total: suggestions.length,
            pending: suggestions.filter((s: any) => s.status === 'pending').length,
            approved: suggestions.filter((s: any) => s.status === 'approved').length,
            rejected: suggestions.filter((s: any) => s.status === 'rejected').length,
          },
        }))
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.users.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.users.admins} admins, {dashboardData.users.moderators} moderators
            </p>
            {dashboardData.users.banned > 0 && (
              <Badge variant="destructive" className="mt-2">
                {dashboardData.users.banned} banned
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Total Features */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.features.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.features.totalVotes} total votes
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <ThumbsUp className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.comments.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.comments.active} active, {dashboardData.comments.hidden} hidden
            </p>
            {dashboardData.comments.deleted > 0 && (
              <Badge variant="outline" className="mt-2">
                {dashboardData.comments.deleted} deleted
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.suggestions.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.suggestions.pending} pending review
            </p>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData.suggestions.pending > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  Needs attention
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Platform Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Platform Activity
            </CardTitle>
            <CardDescription>Overview of platform engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Votes Cast</span>
              <span className="text-2xl font-bold text-primary">
                {dashboardData.features.totalVotes}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Comments Posted</span>
              <span className="text-2xl font-bold text-blue-600">
                {dashboardData.comments.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Suggestions Submitted</span>
              <span className="text-2xl font-bold text-purple-600">
                {dashboardData.suggestions.total}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Feature */}
        {dashboardData.features.topFeature && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Most Popular Feature
              </CardTitle>
              <CardDescription>Feature with the most votes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {dashboardData.features.topFeature.title?.en || 'N/A'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dashboardData.features.topFeature.title?.vi || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {dashboardData.features.topFeature.votesUp || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      {dashboardData.features.topFeature.votesDown || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Actions */}
        {dashboardData.suggestions.pending > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Lightbulb className="w-5 h-5" />
                Pending Actions Required
              </CardTitle>
              <CardDescription>Items that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div>
                  <p className="font-medium">
                    {dashboardData.suggestions.pending} suggestion(s) awaiting review
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review and approve or reject user-submitted feature suggestions
                  </p>
                </div>
                <Badge className="bg-yellow-600 hover:bg-yellow-700">
                  Action Required
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
          <CardDescription>Breakdown of user roles on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                {dashboardData.users.admins}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-muted-foreground">Moderators</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {dashboardData.users.moderators}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
              <p className="text-3xl font-bold">
                {dashboardData.users.total -
                  dashboardData.users.admins -
                  dashboardData.users.moderators}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
