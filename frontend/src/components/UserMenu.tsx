import { useState } from "react";
import { User, LogOut, Lightbulb, ChevronDown, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserMenu() {
  const { user, logout, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const displayName = user.name || user.email.split("@")[0];

  // Get role display info
  const getRoleBadgeColor = () => {
    if (user.role === "admin")
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    if (user.role === "moderator")
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  function handleLogout() {
    logout();
    setShowLogoutConfirm(false);
    navigate("/");
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">{displayName}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="p-3 border-b">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {user.email}
                </p>
                <div className="flex items-center gap-1.5">
                  {(isAdmin || isModerator) && (
                    <Shield className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                  {user.status === "banned" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                      BANNED
                    </span>
                  )}
                </div>
              </div>

              <div className="p-1">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/admin");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary/10 text-primary rounded-md transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/my-suggestions");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  My Suggestions
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
