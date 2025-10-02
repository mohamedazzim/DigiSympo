import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import EventAdminDashboard from "@/pages/event-admin/dashboard";
import ParticipantDashboard from "@/pages/participant/dashboard";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: () => JSX.Element; 
  allowedRoles?: string[] 
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {user ? (
          user.role === 'super_admin' ? <Redirect to="/admin/dashboard" /> :
          user.role === 'event_admin' ? <Redirect to="/event-admin/dashboard" /> :
          <Redirect to="/participant/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} allowedRoles={['super_admin']} />
      </Route>

      <Route path="/event-admin/dashboard">
        <ProtectedRoute component={EventAdminDashboard} allowedRoles={['event_admin']} />
      </Route>

      <Route path="/participant/dashboard">
        <ProtectedRoute component={ParticipantDashboard} allowedRoles={['participant']} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
