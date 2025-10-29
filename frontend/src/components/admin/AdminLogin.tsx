import { useNavigate } from "react-router-dom";
import { Shield, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto mt-16">
      <div className="border rounded-lg p-8 bg-card shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-3">Admin Access</h2>
        <p className="text-center text-muted-foreground mb-8">
          Sign in with your authorized admin email address
        </p>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Email-Based Authentication
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                This system uses secure email-based authentication with
                Role-Based Access Control (RBAC).
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>
                  Only pre-authorized email addresses can access admin features
                </li>
                <li>
                  No passwords required - login via magic link sent to your
                  email
                </li>
                <li>
                  Your role is automatically assigned based on your email
                  address
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              1
            </div>
            <p className="text-sm">
              Click the <strong>"Login"</strong> button in the header
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              2
            </div>
            <p className="text-sm">Enter your authorized admin email address</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              3
            </div>
            <p className="text-sm">Check your email for the magic login link</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              4
            </div>
            <p className="text-sm">
              Click the link to sign in - you'll be redirected here
              automatically
            </p>
          </div>
        </div>

        <Button onClick={() => navigate("/")} className="w-full" size="lg">
          <ArrowRight className="w-4 h-4 mr-2" />
          Go to Login Page
        </Button>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> If your email is not in the admin whitelist,
            you won't be able to access admin features. Contact your system
            administrator to request access.
          </p>
        </div>
      </div>
    </div>
  );
}
