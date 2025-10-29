import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Lightbulb,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Features",
      path: "/admin/features",
      icon: TrendingUp,
    },
    {
      name: "Suggestions",
      path: "/admin/suggestions",
      icon: Lightbulb,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "Comments",
      path: "/admin/comments",
      icon: MessageSquare,
    },
    {
      name: "Statistics",
      path: "/admin/stats",
      icon: BarChart3,
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Fixed */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="flex h-full flex-col">
          {/* Logo & Admin Badge */}
          <div className="border-b p-4 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
            >
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Admin Panel</span>
            </Link>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/10 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="border-t p-4 space-y-2 flex-shrink-0">
            <Link to="/">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Back to Site
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content - With left margin for sidebar */}
      <div className="flex-1 ml-64">
        {/* Top Bar - Sticky */}
        <header className="sticky top-0 z-30 border-b bg-white dark:bg-gray-800 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {menuItems.find((item) => isActive(item.path, item.exact))
                  ?.name || "Admin Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your feature voting platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-full text-xs font-medium">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="p-6 min-h-[calc(100vh-73px)]">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
