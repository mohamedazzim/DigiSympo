import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import ParticipantLayout from '@/components/layouts/ParticipantLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ParticipantDashboard() {
  const [, setLocation] = useLocation();
  const [agreed, setAgreed] = useState(false);
  const { toast } = useToast();

  const { data: credentialData, isLoading } = useQuery({
    queryKey: ['/api/participants/my-credential'],
  });

  if (isLoading) {
    return (
      <ParticipantLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600" data-testid="loading-message">Loading...</p>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  const { credential, event, eventRules, rounds } = credentialData || {};
  const testEnabled = credential?.testEnabled || false;
  const activeRounds = rounds?.filter((r: any) => r.status === 'active') || [];
  const hasActiveRounds = activeRounds.length > 0;

  const allRules = [];
  if (eventRules?.additionalRules) {
    allRules.push(eventRules.additionalRules);
  }

  rounds?.forEach((round: any) => {
    if (round.rules?.additionalRules) {
      allRules.push(`${round.name}: ${round.rules.additionalRules}`);
    }
  });

  const proctoringRules = [];
  if (eventRules?.noRefresh) proctoringRules.push('No page refresh allowed');
  if (eventRules?.noTabSwitch) proctoringRules.push('No tab switching allowed');
  if (eventRules?.forceFullscreen) proctoringRules.push('Fullscreen mode required');
  if (eventRules?.disableShortcuts) proctoringRules.push('Keyboard shortcuts disabled');
  if (eventRules?.autoSubmitOnViolation) proctoringRules.push('Auto-submit on violation');

  const canBeginTest = testEnabled && agreed && hasActiveRounds;

  const startTestMutation = useMutation({
    mutationFn: async (roundId: string) => {
      return apiRequest('POST', `/api/events/${event?.id}/rounds/${roundId}/start`, {});
    },
    onSuccess: (attempt: any) => {
      setLocation(`/participant/test/${attempt.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start test',
        variant: 'destructive',
      });
    },
  });

  const handleBeginTest = () => {
    if (canBeginTest && activeRounds[0]) {
      startTestMutation.mutate(activeRounds[0].id);
    }
  };

  return (
    <ParticipantLayout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="heading-dashboard">
            {event?.name || 'Event Dashboard'}
          </h1>
          <p className="text-gray-600" data-testid="text-event-description">
            {event?.description}
          </p>
        </div>

        {!testEnabled && (
          <Alert className="mb-6" data-testid="alert-test-not-enabled">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Waiting for admin to enable the test. Please check back later.
            </AlertDescription>
          </Alert>
        )}

        {!hasActiveRounds && testEnabled && (
          <Alert className="mb-6" data-testid="alert-no-active-rounds">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active rounds available at the moment. Please wait for the admin to activate a round.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle data-testid="heading-rules">Rules & Regulations</CardTitle>
          </CardHeader>
          <CardContent>
            {proctoringRules.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Proctoring Rules:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {proctoringRules.map((rule, idx) => (
                    <li key={idx} data-testid={`proctoring-rule-${idx}`}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {allRules.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Additional Rules:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {allRules.map((rule, idx) => (
                    <li key={idx} data-testid={`additional-rule-${idx}`}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {proctoringRules.length === 0 && allRules.length === 0 && (
              <p className="text-sm text-gray-500" data-testid="no-rules-message">
                No specific rules have been set for this event.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                data-testid="checkbox-agree"
              />
              <label
                htmlFor="agree"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                data-testid="label-agree"
              >
                I agree to the rules and regulations
              </label>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!canBeginTest || startTestMutation.isPending}
              onClick={handleBeginTest}
              data-testid="button-begin-test"
            >
              {startTestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Test...
                </>
              ) : !testEnabled ? (
                <>
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Test Not Enabled
                </>
              ) : !agreed ? (
                <>
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Please Accept Rules
                </>
              ) : !hasActiveRounds ? (
                <>
                  <AlertCircle className="mr-2 h-5 w-5" />
                  No Active Rounds
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Begin Test
                </>
              )}
            </Button>

            {testEnabled && hasActiveRounds && (
              <p className="text-xs text-gray-500 text-center mt-3" data-testid="text-active-round-info">
                Active Round: {activeRounds[0].name} ({activeRounds[0].duration} minutes)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ParticipantLayout>
  );
}
