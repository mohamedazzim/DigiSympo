import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import ParticipantLayout from '@/components/layouts/ParticipantLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Clock, AlertTriangle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TestAttempt, Question, Answer, Round, EventRules } from '@shared/schema';

interface TestAttemptWithDetails extends TestAttempt {
  round: Round;
  questions: Question[];
  answers: Answer[];
}

export default function TakeTestPage() {
  const { attemptId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violations, setViolations] = useState({ tabSwitch: 0, refresh: 0 });
  const [showViolationWarning, setShowViolationWarning] = useState(false);

  const { data: attempt, isLoading } = useQuery<TestAttemptWithDetails>({
    queryKey: ['/api/attempts', attemptId],
    enabled: !!attemptId,
  });

  const { data: rules } = useQuery<EventRules>({
    queryKey: ['/api/events', attempt?.round?.eventId, 'rules'],
    enabled: !!attempt?.round?.eventId,
  });

  // Initialize answers from existing data
  useEffect(() => {
    if (attempt?.answers) {
      const answerMap: Record<string, string> = {};
      attempt.answers.forEach((ans) => {
        answerMap[ans.questionId] = ans.answer;
      });
      setAnswers(answerMap);
    }
  }, [attempt]);

  // Initialize timer
  useEffect(() => {
    if (attempt?.round && attempt.startedAt) {
      const duration = attempt.round.duration * 60; // Convert to seconds
      const startTime = new Date(attempt.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);
    }
  }, [attempt]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 && attempt && attempt.status === 'in_progress') {
      submitTestMutation.mutate();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, attempt]);

  // Fullscreen enforcement
  useEffect(() => {
    if (!rules?.forceFullscreen) return;

    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attempt?.status === 'in_progress') {
        logViolation('fullscreen_exit');
        enterFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [rules, attempt]);

  // Tab switch detection
  useEffect(() => {
    if (!rules?.noTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden && attempt?.status === 'in_progress') {
        logViolation('tab_switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [rules, attempt]);

  // Disable shortcuts
  useEffect(() => {
    if (!rules?.disableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'p') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        toast({
          title: 'Action blocked',
          description: 'This shortcut is disabled during the test',
          variant: 'destructive',
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rules]);

  // Prevent refresh
  useEffect(() => {
    if (!rules?.noRefresh) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      logViolation('refresh');
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [rules]);

  const logViolation = useCallback((type: string) => {
    if (!attemptId) return;

    apiRequest('POST', `/api/attempts/${attemptId}/violations`, { type }).catch(console.error);

    if (type === 'tab_switch') {
      const newCount = violations.tabSwitch + 1;
      setViolations(prev => ({ ...prev, tabSwitch: newCount }));

      if (rules?.autoSubmitOnViolation && newCount >= (rules.maxTabSwitchWarnings || 2)) {
        toast({
          title: 'Maximum violations exceeded',
          description: 'Your test will be auto-submitted',
          variant: 'destructive',
        });
        setTimeout(() => submitTestMutation.mutate(), 2000);
      } else {
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 3000);
      }
    }
  }, [attemptId, violations, rules]);

  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      return apiRequest('POST', `/api/attempts/${attemptId}/answers`, { questionId, answer });
    },
  });

  const submitTestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/attempts/${attemptId}/submit`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Test submitted',
        description: 'Your test has been submitted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attempts', attemptId] });
      setLocation(`/participant/results/${attemptId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    saveAnswerMutation.mutate({ questionId, answer });
  };

  const handleSubmit = () => {
    if (!attempt?.questions) return;

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = attempt.questions.length;

    if (answeredCount < totalQuestions) {
      const confirmed = window.confirm(
        `You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    submitTestMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <ParticipantLayout>
        <div className="p-8">
          <div className="text-center py-12" data-testid="loading-test">Loading test...</div>
        </div>
      </ParticipantLayout>
    );
  }

  if (!attempt || attempt.status !== 'in_progress') {
    return (
      <ParticipantLayout>
        <div className="p-8">
          <div className="text-center py-12">Test not available or already completed</div>
          <div className="text-center mt-4">
            <Button onClick={() => setLocation('/participant/dashboard')} data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  const currentQuestion = attempt.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / attempt.questions.length) * 100;

  return (
    <ParticipantLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header with timer and progress */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-test-name">
              {attempt.round.name}
            </h1>
            <p className="text-gray-600">
              Question {currentQuestionIndex + 1} of {attempt.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {rules?.autoSubmitOnViolation && (
              <Badge variant="outline" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Violations: {violations.tabSwitch}/{rules.maxTabSwitchWarnings}
              </Badge>
            )}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`} />
              <span className={`font-mono text-lg font-bold ${
                timeRemaining < 300 ? 'text-red-900' : 'text-blue-900'
              }`} data-testid="text-timer">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Violation Warning */}
        {showViolationWarning && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <strong>Warning:</strong> Tab switching detected. You have {
                (rules?.maxTabSwitchWarnings || 2) - violations.tabSwitch
              } warning(s) remaining before auto-submission.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl" data-testid="heading-question">
                  Question {currentQuestion.questionNumber}
                </CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                </Badge>
              </div>
              <Badge>
                {currentQuestion.questionType.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg" data-testid="text-question">
              {currentQuestion.questionText}
            </div>

            {/* Multiple Choice */}
            {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {(currentQuestion.options as string[]).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded border hover:bg-gray-50">
                    <RadioGroupItem value={option} id={`option-${index}`} data-testid={`radio-option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* True/False */}
            {currentQuestion.questionType === 'true_false' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-2 p-3 rounded border hover:bg-gray-50">
                  <RadioGroupItem value="true" id="true" data-testid="radio-true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded border hover:bg-gray-50">
                  <RadioGroupItem value="false" id="false" data-testid="radio-false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            )}

            {/* Short Answer or Coding */}
            {(currentQuestion.questionType === 'short_answer' || currentQuestion.questionType === 'coding') && (
              <Textarea
                placeholder={
                  currentQuestion.questionType === 'coding'
                    ? 'Write your code here...'
                    : 'Type your answer here...'
                }
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[200px] font-mono"
                data-testid="input-answer"
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex < attempt.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    data-testid="button-next"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitTestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-test"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitTestMutation.isPending ? 'Submitting...' : 'Submit Test'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {attempt.questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`p-2 rounded text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[q.id]
                      ? 'bg-green-100 text-green-900 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  data-testid={`button-question-${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Current</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ParticipantLayout>
  );
}
