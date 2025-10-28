import { useTranslation } from 'react-i18next'
import { Edit, Trash2 } from 'lucide-react'
import { deleteFeature, type Feature } from '@/lib/api'
import { formatDate } from '@/lib/utils'

interface FeatureTableProps {
  features: Feature[]
  token: string
  onEdit: (feature: Feature) => void
  onDataChange: () => void
}

export default function FeatureTable({
  features,
  token,
  onEdit,
  onDataChange,
}: FeatureTableProps) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language as 'en' | 'vi'

  async function handleDelete(feature: Feature) {
    const title = feature.title[currentLang] || feature.title.en
    if (!confirm(`Delete "${title}"?`)) return

    try {
      await deleteFeature(token, feature.id)
      onDataChange()
    } catch (err) {
      alert('Failed to delete feature')
      console.error(err)
    }
  }

  if (features.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <p className="text-muted-foreground">No features yet. Add one to get started!</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
            <th className="px-4 py-3 text-center text-sm font-medium">Upvotes</th>
            <th className="px-4 py-3 text-center text-sm font-medium">Downvotes</th>
            <th className="px-4 py-3 text-center text-sm font-medium">Net</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {features.map((feature) => {
            const title = feature.title[currentLang] || feature.title.en
            const netVotes = feature.votesUp - feature.votesDown
            
            return (
              <tr key={feature.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {feature.description[currentLang] || feature.description.en}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">{feature.votesUp}</td>
                <td className="px-4 py-3 text-center">{feature.votesDown}</td>
                <td className="px-4 py-3 text-center">
                  <span className={netVotes >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {netVotes > 0 ? '+' : ''}{netVotes}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(feature.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(feature)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                      title={t('admin.features.edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(feature)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                      title={t('admin.features.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
