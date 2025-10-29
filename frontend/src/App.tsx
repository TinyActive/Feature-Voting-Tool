import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";
import HomePage from "./components/HomePage";
import AdminPage from "./components/admin/AdminPage";
import AuthVerify from "./pages/AuthVerify";
import FeatureDetail from "./pages/FeatureDetail";
import LanguageSwitcher from "./components/LanguageSwitcher";
import LoginModal from "./components/auth/LoginModal";
import UserMenu from "./components/UserMenu";
import { useAuth } from "./contexts/AuthContext";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";

function AppContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hide on admin routes */}
      {!isAdminRoute && (
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              {t("app.title")}
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t("nav.home")}
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
      )}

      {/* Main Content - No container for admin routes */}
      <main className={isAdminRoute ? "" : "container mx-auto px-4 py-8"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feature/:id" element={<FeatureDetail />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/auth/verify" element={<AuthVerify />} />
        </Routes>
      </main>

      {/* Footer - Hide on admin routes */}
      {!isAdminRoute && (
        <footer className="border-t mt-16">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>{t("app.tagline")}</p>
          </div>
        </footer>
      )}

      <Toaster />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
