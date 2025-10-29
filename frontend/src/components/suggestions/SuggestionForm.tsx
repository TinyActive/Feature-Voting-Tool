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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import { Loader2 } from 'lucide-react'

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
        title: `🔒 ${t('suggestion.error.authRequired.title')}`,
        description: t('suggestion.error.authRequired.description'),
        variant: 'destructive',
        duration: 4000,
      })
      return
    }

    if (!formData.titleEn || !formData.titleVi) {
      toast({
        title: `⚠️ ${t('suggestion.error.missingFields.title')}`,
        description: t('suggestion.error.missingFields.description'),
        variant: 'destructive',
        duration: 4000,
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
        title: `✅ ${t('suggestion.success.title')}`,
        description: t('suggestion.success.description'),
        duration: 5000,
      })

      setFormData({ titleEn: '', titleVi: '', descEn: '', descVi: '' })
      
      // Close form after a short delay to let user see the success message
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } catch (error: any) {
      toast({
        title: `❌ ${t('suggestion.error.title')}`,
        description: error.message || t('suggestion.error.description'),
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💡 {t('suggestion.title')}</DialogTitle>
          <DialogDescription>
            {t('suggestion.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4">
            {/* Title EN */}
            <div className="space-y-2">
              <Label htmlFor="titleEn">
                {t('suggestion.titleEn')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder={t('suggestion.placeholderTitleEn')}
                required
              />
            </div>

            {/* Title VI */}
            <div className="space-y-2">
              <Label htmlFor="titleVi">
                {t('suggestion.titleVi')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleVi"
                value={formData.titleVi}
                onChange={(e) => setFormData({ ...formData, titleVi: e.target.value })}
                placeholder={t('suggestion.placeholderTitleVi')}
                required
              />
            </div>

            {/* Description EN */}
            <div className="space-y-2">
              <Label htmlFor="descEn">{t('suggestion.descEn')}</Label>
              <Textarea
                id="descEn"
                value={formData.descEn}
                onChange={(e) => setFormData({ ...formData, descEn: e.target.value })}
                placeholder={t('suggestion.placeholderDescEn')}
                rows={4}
              />
            </div>

            {/* Description VI */}
            <div className="space-y-2">
              <Label htmlFor="descVi">{t('suggestion.descVi')}</Label>
              <Textarea
                id="descVi"
                value={formData.descVi}
                onChange={(e) => setFormData({ ...formData, descVi: e.target.value })}
                placeholder={t('suggestion.placeholderDescVi')}
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
              {t('suggestion.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('suggestion.submitting')}
                </>
              ) : (
                t('suggestion.submit')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
