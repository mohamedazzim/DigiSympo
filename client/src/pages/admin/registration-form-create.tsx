import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, RegistrationForm } from "@shared/schema";

export default function RegistrationFormCreatePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [createdForm, setCreatedForm] = useState<RegistrationForm | null>(null);

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const defaultFields = [
    { id: 'fullName', label: 'Full Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
  ];

  const createFormMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest('POST', `/api/events/${eventId}/registration-forms`, { formFields: defaultFields });
      const form = await response.json();
      return form;
    },
    onSuccess: (data) => {
      setCreatedForm(data);
      queryClient.invalidateQueries({ queryKey: ['/api/registration-forms/all'] });
      toast({
        title: "Success",
        description: "Registration form created successfully",
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

  const handleCreate = () => {
    if (!selectedEventId) {
      toast({
        title: "Error",
        description: "Please select an event",
        variant: "destructive",
      });
      return;
    }
    createFormMutation.mutate(selectedEventId);
  };

  const copyLink = () => {
    if (createdForm) {
      const link = `${window.location.origin}/register/${createdForm.formSlug}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copied",
        description: "Registration form link copied to clipboard",
      });
    }
  };

  if (createdForm) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 max-w-2xl" data-testid="page-form-created">
          <Card>
            <CardHeader>
              <CardTitle data-testid="heading-success">
                <Check className="h-6 w-6 text-green-600 inline mr-2" />
                Registration Form Created
              </CardTitle>
              <CardDescription>Share this link with participants to register</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-medium">Shareable Link:</label>
                <div className="mt-2 p-3 bg-muted rounded-md break-all" data-testid="text-shareable-link">
                  {window.location.origin}/register/{createdForm.formSlug}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-medium">Form Fields:</label>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground" data-testid="list-fields">
                  {defaultFields.map((field) => (
                    <li key={field.id} data-testid={`field-${field.id}`}>
                      {field.label} ({field.type}) {field.required && '- Required'}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={copyLink} data-testid="button-copy-link">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" onClick={() => setLocation('/admin/registration-forms')} data-testid="button-view-all">
                  View All Forms
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-2xl" data-testid="page-create-form">
        <h1 className="text-3xl font-bold mb-6" data-testid="heading-create-form">Create Registration Form</h1>

        <Card>
          <CardHeader>
            <CardTitle>Form Configuration</CardTitle>
            <CardDescription>Select an event and create a public registration form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="font-medium">Select Event *</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger data-testid="select-event">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEvents ? (
                    <SelectItem value="loading" disabled>Loading events...</SelectItem>
                  ) : events && events.length > 0 ? (
                    events.map((event) => (
                      <SelectItem key={event.id} value={event.id} data-testid={`option-event-${event.id}`}>
                        {event.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No events available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Default Form Fields</label>
              <div className="border rounded-md p-4 space-y-2 bg-muted/50">
                {defaultFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between" data-testid={`preview-field-${field.id}`}>
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {field.type} {field.required && '(Required)'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                The form will include Full Name, Email, and Phone Number fields
              </p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!selectedEventId || createFormMutation.isPending}
              className="w-full"
              data-testid="button-create"
            >
              {createFormMutation.isPending ? 'Creating...' : 'Create Registration Form'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
