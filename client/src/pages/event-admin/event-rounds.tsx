import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import EventAdminLayout from '@/components/layouts/EventAdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, FileQuestion, Clock, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Round, Event } from '@shared/schema';

export default function EventRoundsPage() {
  const { eventId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
    enabled: !!eventId,
  });

  const { data: rounds, isLoading: roundsLoading } = useQuery<Round[]>({
    queryKey: ['/api/events', eventId, 'rounds'],
    enabled: !!eventId,
  });

  const startRoundMutation = useMutation({
    mutationFn: async (roundId: string) => {
      return apiRequest('PATCH', `/api/rounds/${roundId}`, {
        status: 'active'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Round Started',
        description: 'Participants can now begin the test',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'rounds'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start round',
        variant: 'destructive',
      });
    }
  });

  const endRoundMutation = useMutation({
    mutationFn: async (roundId: string) => {
      return apiRequest('PATCH', `/api/rounds/${roundId}`, {
        status: 'completed'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Round Ended',
        description: 'Round has been marked as completed',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'rounds'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to end round',
        variant: 'destructive',
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      upcoming: 'secondary',
      active: 'default',
      completed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (eventLoading || roundsLoading) {
    return (
      <EventAdminLayout>
        <div className="p-8">
          <div className="text-center py-12" data-testid="loading-rounds">Loading rounds...</div>
        </div>
      </EventAdminLayout>
    );
  }

  return (
    <EventAdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/event-admin/events')}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Events
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-rounds">Rounds Management</h1>
              <p className="text-gray-600 mt-1">{event?.name}</p>
            </div>
            <Button
              onClick={() => setLocation(`/event-admin/events/${eventId}/rounds/new`)}
              data-testid="button-create-round"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Round
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            {!rounds || rounds.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-600" data-testid="no-rounds">
                  No rounds created yet
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Create your first round to add questions and manage test sessions
                </p>
                <Button
                  onClick={() => setLocation(`/event-admin/events/${eventId}/rounds/new`)}
                  className="mt-4"
                  data-testid="button-create-first"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Round
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rounds.map((round) => (
                    <TableRow key={round.id} data-testid={`row-round-${round.id}`}>
                      <TableCell className="font-medium" data-testid={`text-round-number-${round.id}`}>
                        Round {round.roundNumber}
                      </TableCell>
                      <TableCell>{round.name}</TableCell>
                      <TableCell>{round.duration} minutes</TableCell>
                      <TableCell>{getStatusBadge(round.status)}</TableCell>
                      <TableCell>
                        {round.startTime ? new Date(round.startTime).toLocaleString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {round.status === 'upcoming' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => startRoundMutation.mutate(round.id)}
                              disabled={startRoundMutation.isPending}
                              data-testid={`button-start-${round.id}`}
                              title="Start Round"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {round.status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => endRoundMutation.mutate(round.id)}
                              disabled={endRoundMutation.isPending}
                              data-testid={`button-end-${round.id}`}
                              title="End Round"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              End
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/event-admin/events/${eventId}/rounds/${round.id}/edit`)}
                            data-testid={`button-edit-${round.id}`}
                            title="Edit Round"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/event-admin/rounds/${round.id}/questions`)}
                            data-testid={`button-questions-${round.id}`}
                            title="Manage Questions"
                          >
                            <FileQuestion className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </EventAdminLayout>
  );
}
