import { useEffect, useState } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'
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

interface CommentSectionProps {
  featureId: string
}

export default function CommentSection({ featureId }: CommentSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadComments()
  }, [featureId])

  async function loadComments() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/features/${featureId}/comments`)
      
      if (!response.ok) throw new Error('Failed to load comments')
      
      const data = await response.json()
      setComments(data)
    } catch (error: any) {
      console.error('Load comments error:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCommentAdded() {
    loadComments()
    setShowForm(false)
    toast({
      title: '✅ Comment added!',
    })
  }

  function handleCommentDeleted() {
    loadComments()
    toast({
      title: 'Comment deleted',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </CardTitle>
          {user && !showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              Add Comment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {showForm && (
          <CommentForm
            featureId={featureId}
            onSuccess={handleCommentAdded}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No comments yet</p>
            {!user && (
              <p className="text-sm text-muted-foreground">
                Login to be the first to comment!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                featureId={featureId}
                onDeleted={handleCommentDeleted}
                onReplyAdded={loadComments}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
