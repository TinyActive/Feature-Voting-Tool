import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useRecaptcha } from '@/hooks/useRecaptcha'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface SuggestionFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SuggestionForm({ open, onClose, onSuccess }: SuggestionFormProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const { toast } = useToast()
  const { executeRecaptcha } = useRecaptcha()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titleEn: '',
    titleVi: '',
    descEn: '',
    descVi: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!token) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to suggest features',
        variant: 'destructive',
      })
      return
    }

    if (!formData.titleEn || !formData.titleVi) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both English and Vietnamese titles',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('suggest_feature')

      const response = await fetch(`${API_BASE_URL}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: { en: formData.titleEn, vi: formData.titleVi },
          description: { en: formData.descEn, vi: formData.descVi },
          recaptchaToken,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit suggestion')
      }

      toast({
        title: '🎉 Suggestion submitted!',
        description: 'Admin will review your feature request',
      })

      setFormData({ titleEn: '', titleVi: '', descEn: '', descVi: '' })
      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit suggestion',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest a Feature</DialogTitle>
          <DialogDescription>
            Share your idea for a new feature. Admin will review and may add it to the voting list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4">
            {/* Title EN */}
            <div className="space-y-2">
              <Label htmlFor="titleEn">
                Title (English) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="e.g., Dark mode support"
                required
              />
            </div>

            {/* Title VI */}
            <div className="space-y-2">
              <Label htmlFor="titleVi">
                Title (Vietnamese) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleVi"
                value={formData.titleVi}
                onChange={(e) => setFormData({ ...formData, titleVi: e.target.value })}
                placeholder="vd: Hỗ trợ chế độ tối"
                required
              />
            </div>

            {/* Description EN */}
            <div className="space-y-2">
              <Label htmlFor="descEn">Description (English)</Label>
              <Textarea
                id="descEn"
                value={formData.descEn}
                onChange={(e) => setFormData({ ...formData, descEn: e.target.value })}
                placeholder="Describe your feature idea..."
                rows={4}
              />
            </div>

            {/* Description VI */}
            <div className="space-y-2">
              <Label htmlFor="descVi">Description (Vietnamese)</Label>
              <Textarea
                id="descVi"
                value={formData.descVi}
                onChange={(e) => setFormData({ ...formData, descVi: e.target.value })}
                placeholder="Mô tả ý tưởng của bạn..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Suggestion'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
