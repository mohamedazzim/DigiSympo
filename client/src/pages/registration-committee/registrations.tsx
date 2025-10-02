import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RegistrationCommitteeLayout from "@/components/layouts/RegistrationCommitteeLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Registration, Event } from "@shared/schema";

export default function RegistrationCommitteeRegistrationsPage() {
  const { toast } = useToast();
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string; email: string } | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const { data: registrations, isLoading } = useQuery<Registration[]>({
    queryKey: ['/api/registrations'],
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const approveMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await apiRequest('PATCH', `/api/registrations/${registrationId}/approve`);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setCredentials(data.credentials);
      setShowCredentials(true);
      setSelectedRegistration(null);
      queryClient.invalidateQueries({ queryKey: ['/api/registrations'] });
      toast({
        title: "Success",
        description: "Registration approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getEventName = (eventId: string) => {
    const event = events?.find(e => e.id === eventId);
    return event?.name || eventId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'declined':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const copyCredentials = () => {
    if (credentials) {
      const text = `Username: ${credentials.username}\nPassword: ${credentials.password}\nEmail: ${credentials.email}`;
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Credentials copied to clipboard",
      });
    }
  };

  return (
    <RegistrationCommitteeLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="page-reg-committee-registrations">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="heading-registrations">Registrations</h1>
          <p className="text-muted-foreground">Review and approve participant registrations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registration Submissions</CardTitle>
            <CardDescription>All registration form submissions from participants</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div data-testid="loading-registrations">Loading registrations...</div>
            ) : registrations && registrations.length > 0 ? (
              <Table data-testid="table-registrations">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id} data-testid={`row-registration-${registration.id}`}>
                      <TableCell data-testid={`text-name-${registration.id}`}>
                        {registration.submittedData.fullName}
                      </TableCell>
                      <TableCell data-testid={`text-email-${registration.id}`}>
                        {registration.submittedData.email}
                      </TableCell>
                      <TableCell data-testid={`text-phone-${registration.id}`}>
                        {registration.submittedData.phone || 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-event-${registration.id}`}>
                        {getEventName(registration.eventId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(registration.paymentStatus)} data-testid={`badge-status-${registration.id}`}>
                          {registration.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-submitted-${registration.id}`}>
                        {new Date(registration.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {registration.paymentStatus === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedRegistration(registration)}
                            data-testid={`button-approve-${registration.id}`}
                          >
                            Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-registrations">
                No registrations yet
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedRegistration} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
          <DialogContent data-testid="dialog-approve">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">Approve Registration</DialogTitle>
              <DialogDescription data-testid="dialog-description">
                Review the registration details and mark as paid to create participant credentials
              </DialogDescription>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-2" data-testid="registration-details">
                <div>
                  <span className="font-medium">Name: </span>
                  {selectedRegistration.submittedData.fullName}
                </div>
                <div>
                  <span className="font-medium">Email: </span>
                  {selectedRegistration.submittedData.email}
                </div>
                <div>
                  <span className="font-medium">Phone: </span>
                  {selectedRegistration.submittedData.phone}
                </div>
                <div>
                  <span className="font-medium">Event: </span>
                  {getEventName(selectedRegistration.eventId)}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRegistration(null)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => selectedRegistration && approveMutation.mutate(selectedRegistration.id)}
                disabled={approveMutation.isPending}
                data-testid="button-confirm-approve"
              >
                {approveMutation.isPending ? 'Approving...' : 'Mark as Paid & Create Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
          <DialogContent data-testid="dialog-credentials">
            <DialogHeader>
              <DialogTitle data-testid="credentials-title">
                <CheckCircle className="h-6 w-6 text-green-600 inline mr-2" />
                Registration Approved
              </DialogTitle>
              <DialogDescription data-testid="credentials-description">
                Participant account created successfully. Share these credentials with the participant.
              </DialogDescription>
            </DialogHeader>
            {credentials && (
              <div className="space-y-3 p-4 bg-muted rounded-md" data-testid="credentials-info">
                <div>
                  <span className="font-medium">Username: </span>
                  <code className="text-sm" data-testid="text-username">{credentials.username}</code>
                </div>
                <div>
                  <span className="font-medium">Password: </span>
                  <code className="text-sm" data-testid="text-password">{credentials.password}</code>
                </div>
                <div>
                  <span className="font-medium">Email: </span>
                  <code className="text-sm" data-testid="text-email">{credentials.email}</code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ⚠️ Note: This password will only be shown once. Make sure to save it.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={copyCredentials} variant="outline" data-testid="button-copy-credentials">
                <Copy className="h-4 w-4 mr-2" />
                Copy Credentials
              </Button>
              <Button onClick={() => {
                setShowCredentials(false);
                setCredentials(null);
              }} data-testid="button-close-credentials">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RegistrationCommitteeLayout>
  );
}
