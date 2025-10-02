import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import EventAdminLayout from '@/components/layouts/EventAdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Mail } from 'lucide-react';
import type { Participant, Event, User } from '@shared/schema';

interface ParticipantWithUser extends Participant {
  user?: User;
}

export default function EventParticipantsPage() {
  const { eventId } = useParams();
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
    enabled: !!eventId,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery<ParticipantWithUser[]>({
    queryKey: ['/api/events', eventId, 'participants'],
    enabled: !!eventId,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      registered: 'secondary',
      participated: 'default',
      disqualified: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (eventLoading || participantsLoading) {
    return (
      <EventAdminLayout>
        <div className="p-8">
          <div className="text-center py-12" data-testid="loading-participants">Loading participants...</div>
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-participants">Event Participants</h1>
              <p className="text-gray-600 mt-1">{event?.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600" data-testid="text-total-count">
                {participants?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Participants</div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {!participants || participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-600" data-testid="no-participants">
                  No participants registered yet
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Participants will appear here once they register for the event
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id} data-testid={`row-participant-${participant.id}`}>
                      <TableCell className="font-medium" data-testid={`text-participant-id-${participant.id}`}>
                        {participant.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {participant.userId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell>
                        {participant.registeredAt ? new Date(participant.registeredAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {participants && participants.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {participants.filter(p => p.status === 'registered').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Registered</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {participants.filter(p => p.status === 'participated').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Participated</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {participants.filter(p => p.status === 'disqualified').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Disqualified</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EventAdminLayout>
  );
}
