import { Link, useLocation } from "wouter";
import { ClipboardList, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function RegistrationCommitteeLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <div className="flex min-h-screen" data-testid="layout-registration-committee">
      <aside className="w-64 border-r bg-muted/40 p-4" data-testid="sidebar">
        <div className="mb-6">
          <h2 className="text-xl font-bold" data-testid="sidebar-title">Registration Committee</h2>
          <p className="text-sm text-muted-foreground" data-testid="sidebar-subtitle">
            {user?.fullName}
          </p>
        </div>
        
        <nav className="space-y-2" data-testid="nav">
          <Link href="/registration-committee/dashboard">
            <Button
              variant={isActive("/registration-committee/dashboard") ? "default" : "ghost"}
              className="w-full justify-start"
              data-testid="link-dashboard"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/registration-committee/registrations">
            <Button
              variant={isActive("/registration-committee/registrations") ? "default" : "ghost"}
              className="w-full justify-start"
              data-testid="link-registrations"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Registrations
            </Button>
          </Link>
        </nav>

        <div className="mt-auto pt-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      
      <main className="flex-1" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
