import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, Package } from 'lucide-react'
import { type Stats } from '@/lib/api'

interface StatsCardsProps {
  stats: Stats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language as 'en' | 'vi'

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Total Features */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('admin.stats.totalFeatures')}
          </h3>
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-3xl font-bold">{stats.totalFeatures}</p>
      </div>

      {/* Total Votes */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('admin.stats.totalVotes')}
          </h3>
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-3xl font-bold">{stats.totalVotes}</p>
      </div>

      {/* Top Feature */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('admin.stats.topFeature')}
          </h3>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>
        {stats.topFeature ? (
          <div>
            <p className="text-lg font-semibold line-clamp-1">
              {stats.topFeature.title[currentLang] || stats.topFeature.title.en}
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.topFeature.votesUp - stats.topFeature.votesDown} net votes
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">No features yet</p>
        )}
      </div>
    </div>
  )
}
