import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function AuthVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('No token provided')
      return
    }

    verifyToken(token)
  }, [searchParams])

  async function verifyToken(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify?token=${token}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Invalid or expired token')
      }

      const data = await response.json()
      
      // Save token to localStorage
      localStorage.setItem('auth_token', data.token)
      
      setStatus('success')
      setMessage(`Welcome${data.user.name ? `, ${data.user.name}` : ''}!`)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/')
        window.location.reload() // Reload to update auth context
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Failed to verify token')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-xl font-semibold mb-2">Verifying your login...</h2>
              <p className="text-muted-foreground">Please wait a moment</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold mb-2">Success!</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you to the homepage...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate('/')}>
                Go to Homepage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
