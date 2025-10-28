import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, TrendingUp, Trophy, MessageSquare } from 'lucide-react'
import { voteOnFeature, type Feature } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

interface FeatureCardProps {
  feature: Feature
  rank?: number
  onVoteSuccess?: () => void
}

export default function FeatureCard({ feature, rank, onVoteSuccess }: FeatureCardProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [voting, setVoting] = useState(false)
  const [localVotes, setLocalVotes] = useState({
    up: feature.votesUp,
    down: feature.votesDown,
  })

  const currentLang = i18n.language as 'en' | 'vi'
  const title = feature.title[currentLang] || feature.title.en
  const description = feature.description[currentLang] || feature.description.en

  async function handleVote(voteType: 'up' | 'down') {
    if (voting) return

    try {
      setVoting(true)
      const result = await voteOnFeature(feature.id, { voteType })
      setLocalVotes({ up: result.votesUp, down: result.votesDown })
      
      toast({
        title: voteType === 'up' ? '👍 Upvoted!' : '👎 Downvoted',
        description: `Your vote has been recorded`,
      })
      
      onVoteSuccess?.()
    } catch (err: any) {
      toast({
        title: 'Vote failed',
        description: err.message || t('vote.error'),
        variant: 'destructive',
      })
    } finally {
      setVoting(false)
    }
  }

  const netVotes = localVotes.up - localVotes.down
  const totalVotes = localVotes.up + localVotes.down
  const isTopRanked = rank && rank <= 3

  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer",
      isTopRanked && "border-primary/50 bg-gradient-to-br from-primary/5 to-background"
    )}>
      <CardHeader className="pb-3" onClick={() => navigate(`/feature/${feature.id}`)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          {isTopRanked && (
            <Badge variant="default" className="flex items-center gap-1 shrink-0">
              <Trophy className="w-3 h-3" />
              #{rank}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vote Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleVote('up')}
            disabled={voting}
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 group/btn hover:bg-green-50 hover:border-green-500 hover:text-green-700 dark:hover:bg-green-950",
              voting && "opacity-50"
            )}
          >
            <ThumbsUp className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            <span className="font-semibold">{localVotes.up}</span>
          </Button>

          <Button
            onClick={() => handleVote('down')}
            disabled={voting}
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 group/btn hover:bg-red-50 hover:border-red-500 hover:text-red-700 dark:hover:bg-red-950",
              voting && "opacity-50"
            )}
          >
            <ThumbsDown className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            <span className="font-semibold">{localVotes.down}</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>{totalVotes} {t('features.votes') || 'votes'}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/feature/${feature.id}`)
              }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comments</span>
            </button>
          </div>
          <Badge 
            variant={netVotes > 0 ? 'default' : netVotes < 0 ? 'destructive' : 'secondary'}
            className="font-mono"
          >
            {netVotes > 0 ? '+' : ''}{netVotes}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
