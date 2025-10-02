import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RegistrationForm, Event } from "@shared/schema";

export default function PublicRegistrationFormPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/register/:slug");
  const slug = params?.slug || "";
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading: isLoadingForm } = useQuery<RegistrationForm>({
    queryKey: [`/api/registration-forms/${slug}`],
    enabled: !!slug,
  });

  const { data: event } = useQuery<Event>({
    queryKey: ['/api/events', form?.eventId],
    enabled: !!form?.eventId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest('POST', `/api/registration-forms/${slug}/submit`, data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Success",
        description: "Your registration has been submitted successfully",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    const errors: string[] = [];
    form.formFields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        errors.push(`${field.label} is required`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(formData);
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (isLoadingForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50" data-testid="loading-form">
        <div className="text-center">
          <p className="text-lg">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50" data-testid="form-not-found">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium">Registration form not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The registration link you followed may be invalid or expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50" data-testid="success-page">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" data-testid="success-icon" />
            <h2 className="text-2xl font-bold mb-2" data-testid="success-title">Thank You!</h2>
            <p className="text-muted-foreground" data-testid="success-message">
              Your registration has been submitted successfully. Your registration is pending approval.
              You will receive your login credentials via email once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" data-testid="page-registration-form">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle data-testid="form-title">Event Registration</CardTitle>
            <CardDescription data-testid="form-description">
              {event ? (
                <>
                  Register for <strong>{event.name}</strong>
                  {event.description && (
                    <div className="mt-2 text-sm">{event.description}</div>
                  )}
                </>
              ) : (
                "Complete the form below to register"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="registration-form">
              {form.formFields.map((field) => (
                <div key={field.id} className="space-y-2" data-testid={`field-${field.id}`}>
                  <Label htmlFor={field.id}>
                    {field.label} {field.required && <span className="text-red-600">*</span>}
                  </Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    required={field.required}
                    data-testid={`input-${field.id}`}
                  />
                </div>
              ))}

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
