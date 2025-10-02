import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Copy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import type { RegistrationForm, Event } from "@shared/schema";

export default function RegistrationFormsPage() {
  const { toast } = useToast();

  const { data: forms, isLoading } = useQuery<(RegistrationForm & { event?: Event })[]>({
    queryKey: ['/api/registration-forms/all'],
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/register/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Registration form link copied to clipboard",
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-6xl" data-testid="page-registration-forms">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-registration-forms">Registration Forms</h1>
            <p className="text-muted-foreground">Manage public registration forms for events</p>
          </div>
          {events && events.length > 0 && (
            <Link href="/admin/registration-forms/create">
              <Button data-testid="button-create-form">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div data-testid="loading-forms">Loading forms...</div>
        ) : forms && forms.length > 0 ? (
          <div className="grid gap-4" data-testid="list-forms">
            {forms.map((form) => (
              <Card key={form.id} data-testid={`card-form-${form.id}`}>
                <CardHeader>
                  <CardTitle data-testid={`text-form-slug-${form.id}`}>{form.formSlug}</CardTitle>
                  <CardDescription>
                    Event ID: {form.eventId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Shareable Link: </span>
                      <code className="bg-muted px-2 py-1 rounded text-sm" data-testid={`text-link-${form.id}`}>
                        {window.location.origin}/register/{form.formSlug}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Created: </span>
                      {new Date(form.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Fields: </span>
                      {form.formFields.length} fields
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(form.formSlug)}
                      data-testid={`button-copy-${form.id}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card data-testid="card-no-forms">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No registration forms created yet.
                {events && events.length > 0 ? (
                  <>
                    {" "}
                    <Link href="/admin/registration-forms/create">
                      <Button variant="link" className="p-0" data-testid="link-create-first">
                        Create your first form
                      </Button>
                    </Link>
                  </>
                ) : (
                  " Create an event first to get started."
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
