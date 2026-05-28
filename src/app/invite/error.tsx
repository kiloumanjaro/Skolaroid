'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function InviteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 select-none text-5xl leading-none">✉️</p>
        <h1 className="mb-2 text-lg font-semibold text-gray-900">
          Invitation couldn&apos;t load
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Something went wrong while processing your invitation. Try again or go
          back home.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
