import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  Search,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Ban,
  AlertTriangle,
  CheckCircle,
  User,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface Comment {
  id: string
  feature_id: string
  user_id: string
  user_email?: string
  user_name?: string
  content: string
  status: 'active' | 'hidden' | 'deleted'
  created_at: number
  updated_at: number
  feature_title_en?: string
  feature_title_vi?: string
}

export default function CommentModeration() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog states
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)

  useEffect(() => {
    loadComments()
  }, [])

  async function loadComments() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch comments')

      const data = await response.json()
      setComments(data.comments || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load comments',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleHideComment(commentId: string, hide: boolean) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/comments/${commentId}/${hide ? 'hide' : 'show'}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error(`Failed to ${hide ? 'hide' : 'show'} comment`)

      toast({
        title: 'Success',
        description: `Comment ${hide ? 'hidden' : 'shown'} successfully`,
      })

      loadComments()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update comment',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteComment() {
    if (!selectedComment) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/comments/${selectedComment.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to delete comment')

      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      })

      setShowDeleteDialog(false)
      loadComments()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      })
    }
  }

  async function handleBanUser() {
    if (!selectedComment) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${selectedComment.user_id}/ban`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to ban user')

      toast({
        title: 'Success',
        description: 'User banned successfully',
      })

      setShowBanDialog(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to ban user',
        variant: 'destructive',
      })
    }
  }

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (comment.feature_title_en?.toLowerCase() || '').includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || comment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'hidden':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
          >
            <EyeOff className="w-3 h-3 mr-1" />
            Hidden
          </Badge>
        )
      case 'deleted':
        return (
          <Badge variant="destructive">
            <Trash2 className="w-3 h-3 mr-1" />
            Deleted
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">{comments.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Active</p>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {comments.filter((c) => c.status === 'active').length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Hidden</p>
            <EyeOff className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {comments.filter((c) => c.status === 'hidden').length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Deleted</p>
            <Trash2 className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {comments.filter((c) => c.status === 'deleted').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search comments, users, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comments Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              filteredComments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {comment.user_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {comment.user_email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-md">{truncateText(comment.content, 80)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {comment.feature_title_en || 'Unknown'}
                    </p>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedComment(comment)
                            setShowViewDialog(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Comment
                        </DropdownMenuItem>
                        {comment.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => handleHideComment(comment.id, true)}
                          >
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Comment
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleHideComment(comment.id, false)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Show Comment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-yellow-600"
                          onClick={() => {
                            setSelectedComment(comment)
                            setShowBanDialog(true)
                          }}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedComment(comment)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Comment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Comment Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
            <DialogDescription>
              From {selectedComment?.user_email || 'Unknown user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Feature</label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedComment?.feature_title_en || 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Comment Content</label>
              <div className="mt-2 p-4 bg-secondary rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedComment?.content}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">{selectedComment && getStatusBadge(selectedComment.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Posted</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedComment && formatDate(selectedComment.created_at)}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this comment?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm">{truncateText(selectedComment?.content || '', 150)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment}>
              Delete Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedComment?.user_email}? This will prevent them
              from commenting, voting, and submitting suggestions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
