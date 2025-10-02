import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ParticipantLayout from '@/components/layouts/ParticipantLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { TestAttempt } from '@shared/schema';

export default function MyTestsPage() {
  const [, setLocation] = useLocation();

  const { data: attempts, isLoading } = useQuery<TestAttempt[]>({
    queryKey: ['/api/participants/my-attempts'],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-600">In Progress</Badge>;
      case 'auto_submitted':
        return <Badge variant="destructive">Auto-Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <ParticipantLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-my-tests">My Tests</h1>
          <p className="text-gray-600 mt-1">View all your test attempts and results</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12" data-testid="loading-tests">Loading your tests...</div>
        ) : !attempts || attempts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Yet</h3>
              <p className="text-gray-600 mb-4">You haven't taken any tests yet</p>
              <Button onClick={() => setLocation('/participant/events')} data-testid="button-browse-events">
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const scorePercentage = attempt.maxScore
                ? ((attempt.totalScore || 0) / attempt.maxScore) * 100
                : 0;

              return (
                <Card key={attempt.id} data-testid={`card-attempt-${attempt.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 mt-1">
                            {attempt.status === 'completed' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : attempt.status === 'in_progress' ? (
                              <Clock className="h-6 w-6 text-blue-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900" data-testid="text-round-name">
                              Round {attempt.roundId}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              {getStatusBadge(attempt.status)}
                              <span className="text-sm text-gray-600">
                                Started: {new Date(attempt.startedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          {attempt.status === 'completed' && (
                            <>
                              <div>
                                <div className="text-sm text-gray-600">Score</div>
                                <div className={`text-xl font-bold ${getScoreColor(attempt.totalScore || 0, attempt.maxScore || 1)}`}>
                                  {attempt.totalScore} / {attempt.maxScore}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {scorePercentage.toFixed(1)}%
                                </div>
                              </div>
                            </>
                          )}
                          {(attempt.tabSwitchCount! > 0 || attempt.refreshAttemptCount! > 0) && (
                            <div>
                              <div className="text-sm text-gray-600">Violations</div>
                              <div className="text-xl font-bold text-yellow-600">
                                {(attempt.tabSwitchCount || 0) + (attempt.refreshAttemptCount || 0)}
                              </div>
                            </div>
                          )}
                          {attempt.submittedAt && (
                            <div>
                              <div className="text-sm text-gray-600">Submitted</div>
                              <div className="text-sm font-medium">
                                {new Date(attempt.submittedAt).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        {attempt.status === 'in_progress' ? (
                          <Button
                            onClick={() => setLocation(`/participant/test/${attempt.id}`)}
                            data-testid={`button-continue-${attempt.id}`}
                          >
                            Continue Test
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setLocation(`/participant/results/${attempt.id}`)}
                            data-testid={`button-view-results-${attempt.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Results
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ParticipantLayout>
  );
}
