'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import {
  useValidateInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
  type ValidateInvitationData,
} from '@/lib/hooks/useInvitation';
import { LoginForm } from '@/components/login-form';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  LogIn,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md">
            <InviteCard>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-skolaroid-blue" />
              <p className="mt-3 text-center text-sm text-gray-500">
                Loading...
              </p>
            </InviteCard>
          </div>
        </main>
      }
    >
      <InviteContent />
    </Suspense>
  );
}

type InviteState =
  | 'loading'
  | 'no-token'
  | 'invalid'
  | 'expired'
  | 'group-deleted'
  | 'not-authenticated'
  | 'already-member'
  | 'show-join'
  | 'joining'
  | 'joined'
  | 'declined'
  | 'error';

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { isAuthenticated, loading: authLoading } = useUserAuth();

  const [state, setState] = useState<InviteState>('loading');
  const [inviteData, setInviteData] = useState<ValidateInvitationData | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);

  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  // Only validate once auth is resolved, to avoid premature 401
  const shouldValidate = !authLoading && isAuthenticated && !!token;
  const {
    data: validateData,
    error: validateError,
    isLoading: isValidating,
  } = useValidateInvitation(shouldValidate ? token : null);

  // Handle missing token
  useEffect(() => {
    if (!token) {
      setState('no-token');
    }
  }, [token]);

  // Process validation result
  useEffect(() => {
    if (isValidating || !shouldValidate) return;

    if (validateError) {
      const err = validateError as { code?: string; error?: string };
      switch (err.code) {
        case 'INVALID_TOKEN':
          setState('invalid');
          break;
        case 'EXPIRED':
          setState('expired');
          break;
        case 'GROUP_DELETED':
          setState('group-deleted');
          break;
        case 'NOT_AUTHENTICATED':
          setState('not-authenticated');
          break;
        case 'WRONG_USER':
          setState('invalid');
          break;
        default:
          setState('error');
          setErrorMessage(err.error ?? 'Something went wrong');
      }
      return;
    }

    if (validateData) {
      setInviteData(validateData);
      if (validateData.alreadyMember) {
        setState('already-member');
      } else {
        setState('show-join');
      }
    }
  }, [validateData, validateError, isValidating, shouldValidate]);

  // While auth is loading, show a spinner
  useEffect(() => {
    if (authLoading && token) {
      setState('loading');
    }
  }, [authLoading, token]);

  // If auth loaded and user is not authenticated, handle redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated && token) {
      setState('not-authenticated');
    }
  }, [authLoading, isAuthenticated, token]);

  const handleAccept = async () => {
    if (!token) return;
    setState('joining');
    try {
      const result = await acceptInvitation.mutateAsync(token);
      if (result.alreadyMember) {
        setState('already-member');
      } else {
        setState('joined');
      }
    } catch {
      setState('error');
      setErrorMessage('Failed to join group. Please try again.');
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    try {
      await declineInvitation.mutateAsync(token);
      setState('declined');
    } catch {
      // Even if decline fails, navigate away
      setState('declined');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Loading */}
        {state === 'loading' && (
          <InviteCard>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-skolaroid-blue" />
            <p className="mt-3 text-center text-sm text-gray-500">
              Verifying invitation...
            </p>
          </InviteCard>
        )}

        {/* No token */}
        {state === 'no-token' && (
          <InviteCard>
            <StatusIcon icon={AlertCircle} variant="error" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Invalid invitation link
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              This link is missing the invitation token.
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Invalid token */}
        {state === 'invalid' && (
          <InviteCard>
            <StatusIcon icon={AlertCircle} variant="error" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Invalid invitation link
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              This invitation link is invalid or has already been used.
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <InviteCard>
            <StatusIcon icon={Clock} variant="warning" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              This invitation has expired
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              Ask the group owner to send you a new invitation.
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Group deleted */}
        {state === 'group-deleted' && (
          <InviteCard>
            <StatusIcon icon={AlertCircle} variant="error" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Group no longer exists
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              The group this invitation was for has been deleted.
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Not authenticated */}
        {state === 'not-authenticated' && (
          <InviteCard>
            <StatusIcon icon={LogIn} variant="info" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Sign in to continue
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              You need to sign in to accept this group invitation.
            </p>
            <Button onClick={() => setLoginOpen(true)} className="mt-5 w-full">
              Sign In
            </Button>
          </InviteCard>
        )}

        {/* Already a member */}
        {state === 'already-member' && inviteData && (
          <InviteCard>
            <StatusIcon icon={CheckCircle2} variant="success" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              You already joined this group
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              You&apos;re already a member of{' '}
              <span className="font-medium text-gray-700">
                {inviteData.group.name}
              </span>
              .
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Show join modal */}
        {(state === 'show-join' || state === 'joining') && inviteData && (
          <InviteCard>
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-skolaroid-blue/10">
                <Users className="h-6 w-6 text-skolaroid-blue" />
              </div>
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              You&apos;ve been invited to join
            </h2>

            {/* Group info */}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-skolaroid-blue/10 text-sm font-semibold text-skolaroid-blue">
                  {inviteData.group.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {inviteData.group.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {inviteData.group.memberCount} members
                  </p>
                </div>
              </div>
              {inviteData.group.description && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {inviteData.group.description}
                </p>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-gray-400">
              Invited by{' '}
              <span className="font-medium text-gray-600">
                {inviteData.inviter.name}
              </span>
            </p>

            {/* Action buttons */}
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={state === 'joining'}
                className="flex-1"
              >
                <X className="mr-1.5 h-4 w-4" />
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                disabled={state === 'joining'}
                className="flex-1 bg-skolaroid-blue text-white hover:bg-skolaroid-blue/90"
              >
                {state === 'joining' ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Join Group
              </Button>
            </div>
          </InviteCard>
        )}

        {/* Joined successfully */}
        {state === 'joined' && (
          <InviteCard>
            <StatusIcon icon={CheckCircle2} variant="success" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Welcome to the group!
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              You&apos;ve successfully joined{' '}
              <span className="font-medium text-gray-700">
                {inviteData?.group.name}
              </span>
              .
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Declined */}
        {state === 'declined' && (
          <InviteCard>
            <StatusIcon icon={X} variant="muted" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Invitation declined
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              You&apos;ve declined this invitation.
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}

        {/* Generic error */}
        {state === 'error' && (
          <InviteCard>
            <StatusIcon icon={AlertCircle} variant="error" />
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              {errorMessage || 'Please try again later.'}
            </p>
            <Button onClick={handleGoHome} className="mt-5 w-full">
              Go to Home
            </Button>
          </InviteCard>
        )}
      </div>

      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginForm redirectAfterLogin={`/invite?token=${token}`} />
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────

function InviteCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      {children}
    </div>
  );
}

function StatusIcon({
  icon: Icon,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  variant: 'success' | 'error' | 'warning' | 'info' | 'muted';
}) {
  const colors = {
    success: 'bg-green-50 text-green-500',
    error: 'bg-red-50 text-red-500',
    warning: 'bg-amber-50 text-amber-500',
    info: 'bg-blue-50 text-skolaroid-blue',
    muted: 'bg-gray-50 text-gray-400',
  };

  return (
    <div className="flex justify-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${colors[variant]}`}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
