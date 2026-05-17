'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { FormInput } from '@/components/ui/form-input';
import { FormButton } from '@/components/ui/form-button';
import { FormError } from '@/components/ui/form-error';
import { Label } from '@/components/ui/label';
import { WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignUpForm({
  className,
  onSwitchToLogin,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  onSwitchToLogin?: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            full_name: fullName,
            student_id: studentId,
          },
        },
      });
      if (error) throw error;
      router.push('/onboarding');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // D1: p-8 = 32px internal padding
    <div
      className={cn('flex flex-col gap-4 p-6', className)}
      style={{ borderRadius: WOBBLY_RADIUS_MD }}
      {...props}
    >
      {/* D2: h1 + font-bold for clear visual hierarchy */}
      <h1 className="font-kalam text-2xl font-bold tracking-tight text-foreground">
        Get Started
      </h1>
      <form onSubmit={handleSignUp}>
        {/* D1: gap-6 = 24px between field groups */}
        <div className="flex flex-col gap-6">
          {/* D2: labelClassName font-semibold; D3: h-10 + border-gray-300 standardized across all 4 inputs */}
          <FormInput
            label="Full Name"
            type="text"
            placeholder="Enter Last Name, Given Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            labelClassName="font-semibold text-foreground"
            className="h-10 border border-border"
          />
          <FormInput
            label="Alumni email address"
            type="email"
            placeholder="Enter email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            labelClassName="font-semibold text-foreground"
            className="h-10 border border-border"
          />
          <FormInput
            label="Student ID"
            type="text"
            placeholder="Enter your UP Student ID"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            labelClassName="font-semibold text-foreground"
            className="h-10 border border-border"
          />
          <FormInput
            label="Create new password"
            type="password"
            placeholder="Enter password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            labelClassName="font-semibold text-foreground"
            className="h-10 border border-border"
          />
          {/* D5: gap-3 between rows; py-1 on each row for mobile tap targets */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id="signup-accept-terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              />
              <Label
                htmlFor="signup-accept-terms"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                By registering, I agree to accept the{' '}
                <Link
                  href="/terms"
                  className="font-medium text-skolaroid-blue underline-offset-4 hover:underline"
                >
                  Terms &amp; Service
                </Link>
              </Label>
            </div>
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id="signup-remember-device"
                checked={rememberDevice}
                onCheckedChange={(checked) =>
                  setRememberDevice(checked === true)
                }
              />
              <Label
                htmlFor="signup-remember-device"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Remember this device
              </Label>
            </div>
          </div>
          <FormError message={error} />
          {/* D4: column layout — full-width primary button, secondary link centered below */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <FormButton
              type="submit"
              isLoading={isLoading}
              loadingText="Creating account..."
              disabled={!acceptTerms}
              className="w-full"
            >
              Register
            </FormButton>
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Log to existing
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Log to existing
              </Link>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
