import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createFeature, updateFeature, type Feature } from '@/lib/api'
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

interface FeatureFormProps {
  token: string
  feature: Feature | null
  onClose: () => void
  onSuccess: () => void
}

export default function FeatureForm({ token, feature, onClose, onSuccess }: FeatureFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titleEn: feature?.title.en || '',
    titleVi: feature?.title.vi || '',
    descEn: feature?.description.en || '',
    descVi: feature?.description.vi || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.titleEn || !formData.titleVi) {
      toast({
        title: t('admin.form.required'),
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      
      const payload = {
        title: { en: formData.titleEn, vi: formData.titleVi },
        description: { en: formData.descEn, vi: formData.descVi },
      }

      if (feature) {
        await updateFeature(token, feature.id, payload)
        toast({
          title: 'Success',
          description: 'Feature updated successfully',
        })
      } else {
        await createFeature(token, payload)
        toast({
          title: 'Success',
          description: 'Feature created successfully',
        })
      }

      onSuccess()
    } catch (err: any) {
      console.error('Save error:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to save feature. Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {feature ? t('admin.features.edit') : t('admin.features.add')}
          </DialogTitle>
          <DialogDescription>
            {feature 
              ? 'Update the feature details below' 
              : 'Add a new feature to the voting system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Title EN */}
            <div className="space-y-2">
              <Label htmlFor="titleEn">
                {t('admin.form.titleEn')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="Enter English title"
                required
              />
            </div>

            {/* Title VI */}
            <div className="space-y-2">
              <Label htmlFor="titleVi">
                {t('admin.form.titleVi')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleVi"
                value={formData.titleVi}
                onChange={(e) => setFormData({ ...formData, titleVi: e.target.value })}
                placeholder="Nhập tiêu đề tiếng Việt"
                required
              />
            </div>

            {/* Description EN */}
            <div className="space-y-2">
              <Label htmlFor="descEn">{t('admin.form.descEn')}</Label>
              <Textarea
                id="descEn"
                value={formData.descEn}
                onChange={(e) => setFormData({ ...formData, descEn: e.target.value })}
                placeholder="Enter English description (optional)"
                rows={4}
              />
            </div>

            {/* Description VI */}
            <div className="space-y-2">
              <Label htmlFor="descVi">{t('admin.form.descVi')}</Label>
              <Textarea
                id="descVi"
                value={formData.descVi}
                onChange={(e) => setFormData({ ...formData, descVi: e.target.value })}
                placeholder="Nhập mô tả tiếng Việt (tùy chọn)"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('admin.features.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : t('admin.features.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
