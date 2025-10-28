import { useState } from 'react'
import { Reply, Trash2, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import CommentForm from './CommentForm'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface Comment {
  id: string
  feature_id: string
  user_id: string
  content: string
  parent_id: string | null
  created_at: number
  updated_at: number
  user_name?: string
  user_email?: string
  replies?: Comment[]
}

interface CommentItemProps {
  comment: Comment
  featureId: string
  onDeleted: () => void
  onReplyAdded: () => void
  depth?: number
}

export default function CommentItem({ comment, featureId, onDeleted, onReplyAdded, depth = 0 }: CommentItemProps) {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = user?.id === comment.user_id
  const displayName = comment.user_name || comment.user_email?.split('@')[0] || 'Anonymous'

  async function handleDelete() {
    if (!token || !confirm('Delete this comment?')) return

    try {
      setDeleting(true)
      const response = await fetch(`${API_BASE_URL}/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete comment')

      onDeleted()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  function handleReplySuccess() {
    setShowReplyForm(false)
    onReplyAdded()
  }

  return (
    <div className={depth > 0 ? 'ml-8 mt-4' : ''}>
      <Card className="p-4">
        {/* Comment Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Comment Content */}
        <p className="text-sm whitespace-pre-wrap mb-3">{comment.content}</p>

        {/* Actions */}
        {user && !showReplyForm && depth < 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(true)}
            className="gap-2"
          >
            <Reply className="w-4 h-4" />
            Reply
          </Button>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              featureId={featureId}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </Card>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4 mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              featureId={featureId}
              onDeleted={onDeleted}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
