import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'

interface AdminLoginProps {
  onLogin: (token: string) => Promise<void>
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (token.trim()) {
      try {
        setLoading(true)
        setError('')
        await onLogin(token.trim())
      } catch (err) {
        setError('Invalid admin token')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="border rounded-lg p-8 bg-card shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">{t('admin.title')}</h2>
        <p className="text-center text-muted-foreground mb-6">
          Enter your admin token to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="token" className="block text-sm font-medium mb-2">
              {t('admin.token')}
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter admin token"
              required
              disabled={loading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : t('admin.loginButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
