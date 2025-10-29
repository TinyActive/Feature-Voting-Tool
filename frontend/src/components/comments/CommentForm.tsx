import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useRecaptcha } from '@/hooks/useRecaptcha'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface CommentFormProps {
  featureId: string
  parentId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function CommentForm({ featureId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const { executeRecaptcha } = useRecaptcha()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!token) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to comment',
        variant: 'destructive',
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter a comment',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('create_comment')
      
      const response = await fetch(`${API_BASE_URL}/api/features/${featureId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: parentId || null,
          recaptchaToken,
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setContent('')
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        rows={3}
        disabled={loading}
        maxLength={2000}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {content.length}/2000
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !content.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              parentId ? 'Reply' : 'Comment'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
