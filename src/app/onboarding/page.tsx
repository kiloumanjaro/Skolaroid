'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useOnboardUser } from '@/lib/hooks/useOnboardUser';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { useDeleteUser } from '@/lib/hooks/useDeleteUser';
import { BatchSelectorModal } from '@/components/onboarding/BatchSelectorModal';
import { CourseSelectorModal } from '@/components/onboarding/CourseSelectorModal';
import { NameInputModal } from '@/components/onboarding/NameInputModal';
import { StudentInfoModal } from '@/components/onboarding/StudentInfoModal';

interface OnboardingStep {
  id: string;
  title: string;
  icon: string;
  completed: boolean;
}

type StatusValue = 'STUDENT' | 'ALUMNI';

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const onboardUser = useOnboardUser();
  const deleteUser = useDeleteUser();
  const { user } = useUserAuth();

  // After onboarding, redirect to the original page (e.g. /invite?token=...)
  const redirectTo = searchParams.get('redirect') || '/';
  // Photobooth draft to auto-submit after account creation
  const draftToken = searchParams.get('draft_token');

  // Extract first name from auth user
  const getAuthFirstName = () => {
    if (!user) return '';
    const fullName =
      user.user_metadata?.full_name || user.user_metadata?.name || '';
    return fullName.split(' ')[0] || '';
  };

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusValue>('STUDENT');
  const [onboardError, setOnboardError] = useState<string | null>(null);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [studentInfoModalOpen, setStudentInfoModalOpen] = useState(false);

  // Compute steps with dynamic completion based on actual data
  const steps: OnboardingStep[] = [
    {
      id: 'name',
      title: 'Enter your name',
      icon: '👤',
      completed: firstName !== null && lastName !== null,
    },
    {
      id: 'batch',
      title: 'Select your batch',
      icon: '👥',
      completed: selectedBatch !== null,
    },
    {
      id: 'course',
      title: 'Select your course',
      icon: '📚',
      completed: selectedCourse !== null,
    },
    {
      id: 'studentInfo',
      title: 'Student ID & status',
      icon: '🎓',
      completed: studentId !== null,
    },
  ];

  const handleStepClick = (stepId: string) => {
    if (stepId === 'name') {
      setNameModalOpen(true);
    } else if (stepId === 'batch') {
      setBatchModalOpen(true);
    } else if (stepId === 'course') {
      setCourseModalOpen(true);
    } else if (stepId === 'studentInfo') {
      setStudentInfoModalOpen(true);
    }
  };

  const handleNameSubmit = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
  };

  const handleBatchSelect = (batch: number) => {
    setSelectedBatch(batch);
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
  };

  const handleStudentInfoSubmit = (id: string, s: StatusValue) => {
    setStudentId(id);
    setStatus(s);
  };

  const completedCount = steps.filter((step) => step.completed).length;
  const allCompleted = completedCount === steps.length;

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background to-secondary">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col px-6 py-8 pt-20">
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between">
          <div>
            <h1 className="text-3xl font-normal">
              Welcome,{' '}
              <span className="font-dancing text-4xl text-skolaroid-blue">
                {getAuthFirstName()}
              </span>
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              We&apos;re very excited to get started with you
            </p>
          </div>
        </div>

        {/* Main Card - Flex to fill remaining space */}
        <div className="mt-6 flex min-h-0 flex-grow flex-col border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#2d2d2d]">
          {/* Card Title */}
          <div className="flex-shrink-0">
            <h2 className="text-xl font-semibold text-foreground">
              Finish Onboarding
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Please ensure the following items are complete so that your use
              all of Skolaroid&apos;s feature
            </p>
          </div>

          {/* Steps List - Scrollable if needed but sized to fit */}
          <div className="mt-5 flex-grow space-y-2 overflow-hidden">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className="group flex w-full items-center justify-between border border-border bg-secondary/50 px-4 py-3 text-sm transition hover:border-skolaroid-blue hover:bg-blue-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    disabled
                    className="h-4 w-4 flex-shrink-0 cursor-not-allowed rounded border-border bg-card"
                  />
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex-shrink-0 text-lg">{step.icon}</span>
                    <span className="text-left font-medium text-foreground">
                      {step.title}
                    </span>
                  </div>
                </div>
                <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover:text-skolaroid-blue" />
              </button>
            ))}
          </div>

          {/* Progress Info */}
          <div className="mt-4 flex-shrink-0 text-xs text-muted-foreground">
            {completedCount} of {steps.length} steps completed
          </div>

          {onboardError && (
            <p className="mt-2 text-xs text-red-600">{onboardError}</p>
          )}

          {/* Footer Actions */}
          <div className="mt-4 flex flex-shrink-0 items-center justify-end border-t border-border pt-4">
            <div className="flex gap-2">
              <button
                disabled={deleteUser.isPending}
                onClick={async () => {
                  try {
                    await deleteUser.mutateAsync();
                    window.location.href = '/';
                  } catch (err) {
                    console.error('Failed to delete user:', err);
                  }
                }}
                className="bg-secondary px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary/80 disabled:opacity-50"
              >
                {deleteUser.isPending ? 'Going back...' : 'Back'}
              </button>
              <button
                disabled={!allCompleted || onboardUser.isPending}
                onClick={async () => {
                  if (
                    !firstName ||
                    !lastName ||
                    !selectedBatch ||
                    !selectedCourse ||
                    !studentId
                  )
                    return;
                  setOnboardError(null);
                  try {
                    await onboardUser.mutateAsync({
                      firstName,
                      lastName,
                      batchYear: selectedBatch,
                      programName: selectedCourse,
                      studentId,
                      status,
                    });
                    if (draftToken) {
                      try {
                        const submitRes = await fetch(
                          `/api/photobooth-draft/${draftToken}/submit`,
                          { method: 'POST' }
                        );
                        if (!submitRes.ok) {
                          const errorData = await submitRes.json();
                          console.warn(
                            `[onboarding] draft submission failed: ${submitRes.status} - ${errorData.message}`
                          );
                          window.location.href = `${redirectTo}?photobooth_error=${encodeURIComponent(errorData.message)}`;
                          return;
                        } else {
                          console.log(
                            `[onboarding] draft ${draftToken} submitted successfully`
                          );
                          window.location.href = `${redirectTo}?photobooth_success=true`;
                          return;
                        }
                      } catch (err) {
                        const errMsg =
                          err instanceof Error ? err.message : 'Unknown error';
                        console.error(
                          `[onboarding] draft submission error: ${errMsg}`
                        );
                        window.location.href = `${redirectTo}?photobooth_error=${encodeURIComponent(errMsg)}`;
                        return;
                      }
                    }
                    window.location.href = redirectTo;
                  } catch (err) {
                    setOnboardError(
                      err instanceof Error
                        ? err.message
                        : 'Something went wrong'
                    );
                  }
                }}
                className={`px-4 py-1.5 text-xs font-medium text-white transition ${
                  allCompleted && !onboardUser.isPending
                    ? 'cursor-pointer bg-skolaroid-blue hover:bg-blue-700'
                    : 'cursor-not-allowed bg-muted-foreground opacity-50'
                }`}
              >
                {onboardUser.isPending ? 'Creating account...' : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NameInputModal
        open={nameModalOpen}
        onOpenChange={setNameModalOpen}
        onSubmit={handleNameSubmit}
        initialFirstName={firstName ?? ''}
        initialLastName={lastName ?? ''}
      />
      <BatchSelectorModal
        open={batchModalOpen}
        onOpenChange={setBatchModalOpen}
        onSelect={handleBatchSelect}
      />
      <CourseSelectorModal
        open={courseModalOpen}
        onOpenChange={setCourseModalOpen}
        onSelect={handleCourseSelect}
      />
      <StudentInfoModal
        open={studentInfoModalOpen}
        onOpenChange={setStudentInfoModalOpen}
        onSubmit={handleStudentInfoSubmit}
        initialStudentId={studentId ?? ''}
        initialStatus={status}
      />
    </div>
  );
}
