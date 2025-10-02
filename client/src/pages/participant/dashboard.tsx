import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import ParticipantLayout from '@/components/layouts/ParticipantLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, Trophy, Users } from 'lucide-react';
import type { Event, Participant } from '@shared/schema';

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: registrations } = useQuery<Participant[]>({
    queryKey: ['/api/participants/my-registrations'],
  });

  const activeEvents = events?.filter(e => e.status === 'active') || [];
  const myEventsCount = registrations?.length || 0;

  return (
    <ParticipantLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.fullName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/participant/events')} data-testid="card-available-events">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-events-count">{activeEvents.length}</div>
              <p className="text-xs text-muted-foreground">Events you can join</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/participant/tests')} data-testid="card-my-events">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-registered-count">{myEventsCount}</div>
              <p className="text-xs text-muted-foreground">Registered events</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/participant/results')} data-testid="card-results">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Results</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View</div>
              <p className="text-xs text-muted-foreground">Check your performance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events available for registration</CardDescription>
            </CardHeader>
            <CardContent>
              {activeEvents.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4" data-testid="no-events">
                  No active events available at the moment
                </p>
              ) : (
                <div className="space-y-3">
                  {activeEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => setLocation(`/participant/events/${event.id}`)}
                      data-testid={`event-card-${event.id}`}
                    >
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-xs text-gray-600 capitalize">{event.type}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  ))}
                  {activeEvents.length > 3 && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setLocation('/participant/events')}
                      data-testid="button-view-all"
                    >
                      View All Events
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => setLocation('/participant/events')}
                className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-3"
                data-testid="button-browse-events"
              >
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Browse Events</p>
                  <p className="text-xs text-gray-600">Find events to participate in</p>
                </div>
              </button>
              <button
                onClick={() => setLocation('/participant/results')}
                className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-3"
                data-testid="button-view-results"
              >
                <Trophy className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">View Results</p>
                  <p className="text-xs text-gray-600">Check your scores and rankings</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ParticipantLayout>
  );
}
