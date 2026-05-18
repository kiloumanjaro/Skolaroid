'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import { DeactivateAccountModal } from '@/components/profile/DeactivateAccountModal';
import {
  ProfilePanel,
  profileFlatButtonClass,
} from '@/components/profile/profile-shell';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export function ProfileSettingsCard() {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: currentUserData } = useCurrentUser();
  const isAdmin = currentUserData?.data?.role === 'ADMIN';

  return (
    <>
      <ProfilePanel
        eyebrow=""
        title="Account Controls"
        description="Sensitive account actions stay here so the rest of the page can stay calm."
        accentClassName="bg-[#fff1bd]"
        contentClassName="space-y-4"
      >
        <div className="border-2 border-border bg-white p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-kalam text-lg font-bold text-foreground">
                Password
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/75">
                Password change is not available yet.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className={`${profileFlatButtonClass} w-fit cursor-not-allowed opacity-50`}
              style={{ borderRadius: 0 }}
            >
              Change Password
            </Button>
          </div>
        </div>

        <div className="border-2 border-border bg-[#fff8fb] p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-kalam text-lg font-bold text-foreground">
                Delete Account
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/75">
                Delete your account, or permanently remove it if you are an
                admin.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                id="delete-account-trigger"
                variant="outline"
                size="sm"
                onClick={() => setShowDeactivateDialog(true)}
                className={`${profileFlatButtonClass} w-fit border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive`}
                style={{ borderRadius: 0 }}
              >
                Delete Account
              </Button>
              {isAdmin && (
                <Button
                  id="permanently-delete-account-trigger"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className={`${profileFlatButtonClass} w-fit`}
                  style={{ borderRadius: 0 }}
                >
                  Permanently Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </ProfilePanel>

      <DeactivateAccountModal
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      />
      <DeleteAccountModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
