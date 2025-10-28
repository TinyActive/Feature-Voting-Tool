import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import SuggestionForm from './SuggestionForm'

export default function SuggestFeatureButton() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)

  if (!user) return null

  return (
    <>
      <Button onClick={() => setShowForm(true)} className="gap-2">
        <Lightbulb className="w-4 h-4" />
        Suggest Feature
      </Button>
      <SuggestionForm open={showForm} onClose={() => setShowForm(false)} />
    </>
  )
}
