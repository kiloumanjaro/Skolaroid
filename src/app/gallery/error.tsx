'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function GalleryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-sm border-[3px] border-border bg-card p-10 text-center shadow-[6px_6px_0px_0px_#2d2d2d]">
        <p className="mb-4 select-none text-5xl leading-none">🖼️</p>
        <h1 className="mb-2 text-2xl font-bold">Gallery couldn&apos;t load</h1>
        <p className="mb-8 text-muted-foreground">
          Something went wrong while loading the gallery. Try refreshing or go
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
