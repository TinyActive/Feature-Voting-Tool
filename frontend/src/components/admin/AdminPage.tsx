import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "./AdminLayout";
import DashboardOverview from "./DashboardOverview";
import UserManagement from "./UserManagement";
import CommentModeration from "./CommentModeration";
import FeatureManagement from "./FeatureManagement";
import SuggestionsManager from "./SuggestionsManager";
import { Button } from "@/components/ui/button";
import { Shield, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="border rounded-lg p-8 bg-card shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in with your admin account to access the admin panel.
            </p>

            <Button onClick={() => navigate("/")} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Go to Login
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Only authorized admin accounts can access this area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="border rounded-lg p-8 bg-card shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-2">
              Your account ({user.email}) does not have admin privileges.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Role: <span className="font-medium capitalize">{user.role}</span>
            </p>

            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Contact your system administrator if you need admin access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin user - show admin panel with routing
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/comments" element={<CommentModeration />} />
        <Route path="/features" element={<FeatureManagement />} />
        <Route path="/suggestions" element={<SuggestionsManager />} />
        <Route path="/stats" element={<DashboardOverview />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}
