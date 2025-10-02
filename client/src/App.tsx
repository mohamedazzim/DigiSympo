import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import EventsPage from "@/pages/admin/events";
import EventCreatePage from "@/pages/admin/event-create";
import EventEditPage from "@/pages/admin/event-edit";
import EventDetailsPage from "@/pages/admin/event-details";
import EventAdminsPage from "@/pages/admin/event-admins";
import EventAdminCreatePage from "@/pages/admin/event-admin-create";
import ReportsPage from "@/pages/admin/reports";
import EventAdminDashboard from "@/pages/event-admin/dashboard";
import EventAdminEventsPage from "@/pages/event-admin/events";
import EventRulesPage from "@/pages/event-admin/event-rules";
import EventRoundsPage from "@/pages/event-admin/event-rounds";
import RoundCreatePage from "@/pages/event-admin/round-create";
import RoundQuestionsPage from "@/pages/event-admin/round-questions";
import QuestionCreatePage from "@/pages/event-admin/question-create";
import EventParticipantsPage from "@/pages/event-admin/event-participants";
import ParticipantDashboard from "@/pages/participant/dashboard";
import ParticipantEventsPage from "@/pages/participant/events";

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
      <Route path="/admin/events">
        <ProtectedRoute component={EventsPage} allowedRoles={['super_admin']} />
      </Route>
      <Route path="/admin/events/new">
        <ProtectedRoute component={EventCreatePage} allowedRoles={['super_admin']} />
      </Route>
      <Route path="/admin/events/:id/edit">
        <ProtectedRoute component={EventEditPage} allowedRoles={['super_admin']} />
      </Route>
      <Route path="/admin/events/:id">
        <ProtectedRoute component={EventDetailsPage} allowedRoles={['super_admin']} />
      </Route>
      <Route path="/admin/event-admins">
        <ProtectedRoute component={EventAdminsPage} allowedRoles={['super_admin']} />
      </Route>
      <Route path="/admin/event-admins/create">
        <ProtectedRoute component={EventAdminCreatePage} allowedRoles={['super_admin']} />
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute component={ReportsPage} allowedRoles={['super_admin']} />
      </Route>

      <Route path="/event-admin/dashboard">
        <ProtectedRoute component={EventAdminDashboard} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/events">
        <ProtectedRoute component={EventAdminEventsPage} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/events/:eventId/rules">
        <ProtectedRoute component={EventRulesPage} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/events/:eventId/rounds/new">
        <ProtectedRoute component={RoundCreatePage} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/events/:eventId/rounds">
        <ProtectedRoute component={EventRoundsPage} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/rounds/:roundId/questions/new">
        <ProtectedRoute component={QuestionCreatePage} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/rounds/:roundId/questions">
        <ProtectedRoute component={RoundQuestionsPage} allowedRoles={['event_admin']} />
      </Route>
      <Route path="/event-admin/events/:eventId/participants">
        <ProtectedRoute component={EventParticipantsPage} allowedRoles={['event_admin']} />
      </Route>

      <Route path="/participant/dashboard">
        <ProtectedRoute component={ParticipantDashboard} allowedRoles={['participant']} />
      </Route>
      <Route path="/participant/events">
        <ProtectedRoute component={ParticipantEventsPage} allowedRoles={['participant']} />
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
