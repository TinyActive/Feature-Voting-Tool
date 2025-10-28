import { useEffect, useState } from 'react'
import { Check, X, Loader2, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface Suggestion {
  id: string
  user_id: string
  user_email?: string
  title: { en: string; vi: string }
  description: { en: string; vi: string }
  status: 'pending' | 'approved' | 'rejected'
  approved_feature_id: string | null
  created_at: number
  updated_at: number
}

interface SuggestionsManagerProps {
  token: string
}

export default function SuggestionsManager({ token }: SuggestionsManagerProps) {
  const { toast } = useToast()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [])

  async function loadSuggestions() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/suggestions?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to load suggestions')

      const data = await response.json()
      setSuggestions(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load suggestions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      setActionLoading(id)
      const response = await fetch(`${API_BASE_URL}/api/admin/suggestions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to approve suggestion')

      toast({
        title: '✅ Approved!',
        description: 'Feature has been created and added to voting',
      })

      // Remove from list
      setSuggestions(prev => prev.filter(s => s.id !== id))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve suggestion',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    try {
      setActionLoading(id)
      const response = await fetch(`${API_BASE_URL}/api/admin/suggestions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to reject suggestion')

      toast({
        title: 'Rejected',
        description: 'Suggestion has been rejected',
      })

      // Remove from list
      setSuggestions(prev => prev.filter(s => s.id !== id))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject suggestion',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Suggestions</h2>
          <p className="text-muted-foreground">Review and approve user-submitted features</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {suggestions.length} Pending
        </Badge>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No pending suggestions</p>
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {suggestion.title.en}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {suggestion.title.vi}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {(suggestion.description.en || suggestion.description.vi) && (
                  <div className="space-y-2">
                    {suggestion.description.en && (
                      <p className="text-sm text-muted-foreground">
                        <strong>EN:</strong> {suggestion.description.en}
                      </p>
                    )}
                    {suggestion.description.vi && (
                      <p className="text-sm text-muted-foreground">
                        <strong>VI:</strong> {suggestion.description.vi}
                      </p>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Submitted by: {suggestion.user_email || 'User'}</span>
                  <span>•</span>
                  <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleApprove(suggestion.id)}
                    disabled={actionLoading === suggestion.id}
                    className="flex-1"
                  >
                    {actionLoading === suggestion.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Approve & Create Feature
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReject(suggestion.id)}
                    disabled={actionLoading === suggestion.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {actionLoading === suggestion.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
