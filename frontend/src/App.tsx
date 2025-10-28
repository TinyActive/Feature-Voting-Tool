import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn } from 'lucide-react'
import HomePage from './components/HomePage'
import AdminPage from './components/admin/AdminPage'
import AuthVerify from './pages/AuthVerify'
import FeatureDetail from './pages/FeatureDetail'
import LanguageSwitcher from './components/LanguageSwitcher'
import LoginModal from './components/auth/LoginModal'
import UserMenu from './components/UserMenu'
import { useAuth } from './contexts/AuthContext'
import { Button } from './components/ui/button'
import { Toaster } from './components/ui/toaster'

function App() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              {t('app.title')}
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                {t('nav.admin')}
              </Link>
              <LanguageSwitcher />
              {user ? (
                <UserMenu />
              ) : (
                <Button onClick={() => setShowLogin(true)} size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feature/:id" element={<FeatureDetail />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth/verify" element={<AuthVerify />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t mt-16">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>{t('app.tagline')}</p>
          </div>
        </footer>
      </div>
      <Toaster />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </BrowserRouter>
  )
}

export default App
