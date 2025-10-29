import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFeatures, getStats, type Feature, type Stats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import { Button } from "@/components/ui/button";
import { Shield, LogIn } from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin && token) {
      loadData();
    }
  }, [isAdmin, token]);

  async function loadData() {
    if (!token) return;

    try {
      setLoading(true);
      const [featuresData, statsData] = await Promise.all([
        getFeatures(),
        getStats(token),
      ]);
      setFeatures(featuresData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
      <div className="max-w-md mx-auto mt-16">
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
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16">
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
    );
  }

  // Admin user - show dashboard
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span>
            Logged in as:{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
            {user.role.toUpperCase()}
          </span>
        </div>
      </div>

      <AdminDashboard
        token={token!}
        features={features}
        stats={stats}
        loading={loading}
        onLogout={() => {}}
        onDataChange={loadData}
      />
    </div>
  );
}
