import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ThumbsUp, ThumbsDown, Loader2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import CommentSection from '@/components/comments/CommentSection'
import { useToast } from '@/components/ui/use-toast'
import { useRecaptcha } from '@/hooks/useRecaptcha'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface Feature {
  id: string
  title: { en: string; vi: string }
  description: { en: string; vi: string }
  votesUp: number
  votesDown: number
  createdAt: number
}

export default function FeatureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const { executeRecaptcha } = useRecaptcha()
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    if (id) {
      loadFeature()
    }
  }, [id])

  async function loadFeature() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/features`)
      if (!response.ok) throw new Error('Failed to load features')
      
      const features = await response.json()
      const found = features.find((f: any) => f.id === id)
      
      if (!found) {
        toast({
          title: 'Feature not found',
          variant: 'destructive',
        })
        navigate('/')
        return
      }
      
      setFeature(found)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load feature',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(voteType: 'up' | 'down') {
    if (!feature || voting) return

    try {
      setVoting(true)

      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('vote_feature')

      const response = await fetch(`${API_BASE_URL}/api/features/${feature.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType, recaptchaToken }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to vote' }))
        throw new Error(errorData.error || 'Failed to vote')
      }

      const result = await response.json()
      setFeature({
        ...feature,
        votesUp: result.votesUp,
        votesDown: result.votesDown,
      })

      toast({
        title: voteType === 'up' ? '👍 Upvoted!' : '👎 Downvoted',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to vote',
        variant: 'destructive',
      })
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Feature not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    )
  }

  const currentLang = i18n.language as 'en' | 'vi'
  const title = feature.title[currentLang] || feature.title.en
  const description = feature.description[currentLang] || feature.description.en
  const netVotes = feature.votesUp - feature.votesDown

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Features
      </Button>

      {/* Feature Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-3xl">{title}</CardTitle>
            <Badge 
              variant={netVotes > 0 ? 'default' : netVotes < 0 ? 'destructive' : 'secondary'}
              className="text-lg px-4 py-2 font-mono shrink-0"
            >
              {netVotes > 0 ? '+' : ''}{netVotes}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-base text-muted-foreground whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}

          {/* Voting Section */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              onClick={() => handleVote('up')}
              disabled={voting}
              variant="outline"
              size="lg"
              className="flex-1 hover:bg-green-50 hover:border-green-500 hover:text-green-700 dark:hover:bg-green-950"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              Upvote ({feature.votesUp})
            </Button>
            <Button
              onClick={() => handleVote('down')}
              disabled={voting}
              variant="outline"
              size="lg"
              className="flex-1 hover:bg-red-50 hover:border-red-500 hover:text-red-700 dark:hover:bg-red-950"
            >
              <ThumbsDown className="w-5 h-5 mr-2" />
              Downvote ({feature.votesDown})
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{feature.votesUp + feature.votesDown} total votes</span>
            </div>
            <span>•</span>
            <span>Created {new Date(feature.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommentSection featureId={feature.id} />
    </div>
  )
}
