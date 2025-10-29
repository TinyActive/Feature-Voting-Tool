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
  Shield,
  ShieldCheck,
  UserCog,
  Ban,
  CheckCircle,
  Trash2,
  Mail,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface User {
  id: string
  email: string
  name: string | null
  role: 'user' | 'moderator' | 'admin'
  status: 'active' | 'banned'
  created_at: number
  last_login_at: number | null
}

export default function UserManagement() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newRole, setNewRole] = useState<string>('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateRole() {
    if (!selectedUser || !newRole) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${selectedUser.id}/role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (!response.ok) throw new Error('Failed to update role')

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      })

      setShowRoleDialog(false)
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      })
    }
  }

  async function handleBanUser(ban: boolean) {
    if (!selectedUser) return

    try {
      const endpoint = ban ? 'ban' : 'unban'
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${selectedUser.id}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error(`Failed to ${endpoint} user`)

      toast({
        title: 'Success',
        description: `User ${ban ? 'banned' : 'unbanned'} successfully`,
      })

      setShowBanDialog(false)
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    }
    return variants[role] || variants.user
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5" />
      case 'moderator':
        return <Shield className="w-3.5 h-3.5" />
      default:
        return <UserCog className="w-3.5 h-3.5" />
    }
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
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
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            <UserCog className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Admins</p>
            <ShieldCheck className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {users.filter((u) => u.role === 'admin').length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Moderators</p>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {users.filter((u) => u.role === 'moderator').length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Banned</p>
            <Ban className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {users.filter((u) => u.status === 'banned').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${getRoleBadge(user.role)} flex items-center gap-1 w-fit`}
                    >
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.status === 'active' ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.last_login_at)}
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
                            setSelectedUser(user)
                            setNewRole(user.role)
                            setShowRoleDialog(true)
                          }}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setShowBanDialog(true)
                          }}
                        >
                          {user.status === 'active' ? (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Ban User
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Unban User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
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

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'active' ? 'Ban User' : 'Unban User'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedUser?.status === 'active' ? 'ban' : 'unban'}{' '}
              {selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.status === 'active' ? 'destructive' : 'default'}
              onClick={() => handleBanUser(selectedUser?.status === 'active')}
            >
              {selectedUser?.status === 'active' ? 'Ban User' : 'Unban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete {selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive">Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
