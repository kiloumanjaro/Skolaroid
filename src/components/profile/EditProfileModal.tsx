'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { useUpdateProfile } from '@/lib/hooks/useUpdateProfile';
import { updateProfileSchema } from '@/lib/schemas';
import type { CurrentUserProfile } from '@/lib/hooks/useCurrentUser';
import type { User } from '@supabase/supabase-js';
import { profileFlatButtonClass } from '@/components/profile/ProfileShell';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dbUser: CurrentUserProfile | null;
  authUser: User | null;
}

export function EditProfileModal({
  open,
  onOpenChange,
  dbUser,
  authUser,
}: EditProfileModalProps) {
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [contactOther, setContactOther] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const avatarUrl =
    authUser?.user_metadata?.avatar_url ??
    authUser?.user_metadata?.picture ??
    null;

  // Populate form when modal opens
  useEffect(() => {
    if (open && dbUser) {
      setBio(dbUser.bio ?? '');
      setPhone(dbUser.phone ?? '');
      setLinkedinUrl(dbUser.linkedinUrl ?? '');
      setFacebookUrl(dbUser.facebookUrl ?? '');
      setContactOther(dbUser.contactOther ?? '');
      setErrors({});
      setSubmitError(null);
    }
  }, [open, dbUser]);

  const handleSubmit = () => {
    setErrors({});
    setSubmitError(null);

    const parsed = updateProfileSchema.safeParse({
      bio: bio || undefined,
      phone: phone || undefined,
      linkedinUrl: linkedinUrl || undefined,
      facebookUrl: facebookUrl || undefined,
      contactOther: contactOther || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    updateProfile(parsed.data, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        setSubmitError(
          err instanceof Error ? err.message : 'Something went wrong'
        ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-none border-2 border-border p-0 shadow-none"
        showCloseButton={false}
        style={{ borderRadius: 0 }}
      >
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3">
            <div className="shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full border-2 border-border object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-foreground bg-card text-foreground">
                  <UserIcon className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>

          {/* About Me section */}
          <div className="space-y-3">
            <h3 className="font-kalam text-sm font-bold text-foreground">
              About Me
            </h3>
            <div className="grid gap-1.5">
              <Label htmlFor="bio" className="font-hand text-sm">
                Bio
              </Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="Tell people a little about yourself…"
                className={cn(
                  'h-24 w-full resize-none border-2 border-border bg-transparent px-3 py-2 font-hand text-base transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
                  errors.bio &&
                    'border-destructive focus-visible:ring-destructive/20'
                )}
                style={{ borderRadius: 0 }}
              />
              <div className="flex items-center justify-between">
                {errors.bio ? (
                  <p className="font-hand text-xs text-destructive">
                    {errors.bio}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-right font-hand text-xs text-muted-foreground">
                  {bio.length}/500
                </p>
              </div>
            </div>
          </div>

          <hr className="border-dashed border-muted-foreground/30" />

          {/* Contact Info section */}
          <div className="space-y-3">
            <h3 className="font-kalam text-sm font-bold text-foreground">
              Contact Info
            </h3>

            {/* Phone */}
            <div className="grid gap-1.5">
              <Label htmlFor="phone" className="font-hand text-sm">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 XXX XXX XXXX"
                className={cn(
                  errors.phone &&
                    'border-destructive focus-visible:ring-destructive/20'
                )}
                style={{ borderRadius: 0 }}
              />
              {errors.phone && (
                <p className="font-hand text-xs text-destructive">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="grid gap-1.5">
              <Label htmlFor="linkedinUrl" className="font-hand text-sm">
                LinkedIn
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/…"
                className={cn(
                  errors.linkedinUrl &&
                    'border-destructive focus-visible:ring-destructive/20'
                )}
                style={{ borderRadius: 0 }}
              />
              {errors.linkedinUrl && (
                <p className="font-hand text-xs text-destructive">
                  {errors.linkedinUrl}
                </p>
              )}
            </div>

            {/* Facebook */}
            <div className="grid gap-1.5">
              <Label htmlFor="facebookUrl" className="font-hand text-sm">
                Facebook
              </Label>
              <Input
                id="facebookUrl"
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/…"
                className={cn(
                  errors.facebookUrl &&
                    'border-destructive focus-visible:ring-destructive/20'
                )}
                style={{ borderRadius: 0 }}
              />
              {errors.facebookUrl && (
                <p className="font-hand text-xs text-destructive">
                  {errors.facebookUrl}
                </p>
              )}
            </div>

            {/* Other */}
            <div className="grid gap-1.5">
              <Label htmlFor="contactOther" className="font-hand text-sm">
                Other
              </Label>
              <Input
                id="contactOther"
                type="text"
                value={contactOther}
                onChange={(e) => setContactOther(e.target.value)}
                placeholder="Discord, Twitter, etc."
                className={cn(
                  errors.contactOther &&
                    'border-destructive focus-visible:ring-destructive/20'
                )}
                style={{ borderRadius: 0 }}
              />
              {errors.contactOther && (
                <p className="font-hand text-xs text-destructive">
                  {errors.contactOther}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pinned footer */}
        <div className="flex items-center justify-between gap-3 border-t-2 border-border bg-card px-6 py-4">
          <div className="min-w-0 flex-1">
            {submitError && (
              <p className="truncate font-hand text-xs text-destructive">
                {submitError}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className={profileFlatButtonClass}
              style={{ borderRadius: 0 }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className={profileFlatButtonClass}
              style={{ borderRadius: 0 }}
            >
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
