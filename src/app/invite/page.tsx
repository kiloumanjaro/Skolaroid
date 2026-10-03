import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InviteContent from './invite-client';

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-skolaroid-blue" />
              <p className="mt-3 text-center text-sm text-gray-500">
                Loading...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
