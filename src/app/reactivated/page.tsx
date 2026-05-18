import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Shown immediately after a deactivated user logs back in within the 30-day grace period
export default function ReactivatedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <Check size={20} className="text-green-500" />
        </div>

        <h1 className="font-kalam text-lg font-semibold text-foreground">
          Your account has been reactivated
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          All your memories have been restored. Welcome back!
        </p>

        <Button asChild className="mt-6 w-full">
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  );
}
