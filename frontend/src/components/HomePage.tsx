import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react'
import { getFeatures, type Feature } from '@/lib/api'
import FeatureCard from './FeatureCard'
import SuggestFeatureButton from './suggestions/SuggestFeatureButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  const { t } = useTranslation()
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeatures()
  }, [])

  async function loadFeatures() {
    try {
      setLoading(true)
      setError(null)
      const data = await getFeatures()
      // Sort by net votes (up - down)
      const sorted = data.sort((a, b) => 
        (b.votesUp - b.votesDown) - (a.votesUp - a.votesDown)
      )
      setFeatures(sorted)
    } catch (err) {
      setError(t('features.error'))
      console.error('Failed to load features:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
        </div>
        <p className="mt-6 text-lg text-muted-foreground animate-pulse">{t('features.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive text-lg font-medium mb-4">{error}</p>
          <Button onClick={loadFeatures} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="relative px-8 py-12 md:px-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('features.title')}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t('app.tagline')}
          </p>
          
          {/* Suggest Feature Button */}
          <div className="mt-6">
            <SuggestFeatureButton />
          </div>
          
          {/* Stats Bar */}
          {features.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{features.length}</p>
                  <p className="text-sm text-muted-foreground">{t('features.total') || 'Features'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {features.reduce((sum, f) => sum + f.votesUp + f.votesDown, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('features.totalVotes') || 'Total Votes'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      {features.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {t('features.noFeatures')}
            </p>
            <p className="text-sm text-muted-foreground">
              Be the first to suggest a feature!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {t('features.browse') || 'Browse Features'}
            </h2>
            <Button variant="outline" size="sm" onClick={loadFeatures}>
              Refresh
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard 
                key={feature.id} 
                feature={feature} 
                rank={index + 1}
                onVoteSuccess={loadFeatures} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
