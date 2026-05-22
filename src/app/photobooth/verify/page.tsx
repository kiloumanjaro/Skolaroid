'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No draft token provided');
      return;
    }

    const submitDraft = async () => {
      try {
        const res = await fetch(`/api/photobooth-draft/${token}/submit`, {
          method: 'POST',
        });

        if (!res.ok) {
          const data = await res.json();
          setStatus('error');
          setMessage(
            data.message || 'Failed to save your photo. Please try again.'
          );
          console.error(
            `[photobooth/verify] submission failed: ${res.status}`,
            data
          );
          return;
        }

        const data = await res.json();
        setStatus('success');
        setMessage('Your memory has been saved!');
        console.log('[photobooth/verify] submission successful', data);

        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/?photobooth_success=true');
        }, 3000);
      } catch (err) {
        setStatus('error');
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setMessage(`Error: ${errMsg}`);
        console.error('[photobooth/verify] error:', err);
      }
    };

    submitDraft();
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-background to-secondary px-4">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-lg border-2 border-border bg-card p-8 shadow-lg">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-skolaroid-blue" />
            <p className="text-center text-sm font-medium text-foreground">
              Saving your memory...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-center text-sm font-semibold text-green-700">
              {message}
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting you home...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-600" />
            <p className="text-center text-sm font-semibold text-red-700">
              {message}
            </p>
            <div className="flex w-full gap-2">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
              <Button onClick={() => router.back()} className="flex-1">
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PhotoboothVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
