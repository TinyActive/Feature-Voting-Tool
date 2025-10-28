import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, Plus } from 'lucide-react'
import { type Feature, type Stats } from '@/lib/api'
import StatsCards from './StatsCards'
import FeatureTable from './FeatureTable'
import FeatureForm from './FeatureForm'
import SuggestionsManager from './SuggestionsManager'

interface AdminDashboardProps {
  token: string
  features: Feature[]
  stats: Stats | null
  loading: boolean
  onLogout: () => void
  onDataChange: () => void
}

export default function AdminDashboard({
  token,
  features,
  stats,
  loading,
  onLogout,
  onDataChange,
}: AdminDashboardProps) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)

  function handleEdit(feature: Feature) {
    setEditingFeature(feature)
    setShowForm(true)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditingFeature(null)
  }

  function handleFormSuccess() {
    handleFormClose()
    onDataChange()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('admin.title')}</h1>
          <p className="text-muted-foreground">Manage features and view statistics</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-secondary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('admin.logout')}
        </button>
      </div>

      {/* Stats */}
      {stats && <StatsCards stats={stats} />}

      {/* Suggestions Management */}
      <div className="mt-8">
        <SuggestionsManager token={token} />
      </div>

      {/* Features Management */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{t('admin.features.title')}</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {t('admin.features.add')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : (
          <FeatureTable
            features={features}
            token={token}
            onEdit={handleEdit}
            onDataChange={onDataChange}
          />
        )}
      </div>

      {/* Feature Form Modal */}
      {showForm && (
        <FeatureForm
          token={token}
          feature={editingFeature}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
