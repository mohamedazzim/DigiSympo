import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Trophy,
  LayoutDashboard,
  LogOut,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/participant/dashboard', icon: LayoutDashboard },
  { name: 'Events', href: '/participant/events', icon: Calendar },
  { name: 'My Tests', href: '/participant/my-tests', icon: FileText },
];

export default function ParticipantLayout({ children }: ParticipantLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Symposium Management</h1>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-600">Participant</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center" data-testid="user-avatar">
                <span className="text-white text-sm font-medium">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500" data-testid="text-user-email">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + '/');
              
              return (
                <button
                  key={item.name}
                  onClick={() => setLocation(item.href)}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
