'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeactivateAccountDialog } from '@/components/profile/DeactivateAccountDialog';
import {
  ProfilePanel,
  profileFlatButtonClass,
} from '@/components/profile/profile-shell';

export function ProfileSettingsCard() {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  return (
    <>
      <ProfilePanel
        eyebrow="Settings"
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
                Deactivate Account
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/75">
                You have 30 days to reactivate before permanent deletion.
              </p>
            </div>
            <Button
              id="deactivate-account-trigger"
              variant="outline"
              size="sm"
              onClick={() => setShowDeactivateDialog(true)}
              className={`${profileFlatButtonClass} w-fit border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive`}
              style={{ borderRadius: 0 }}
            >
              Deactivate Account
            </Button>
          </div>
        </div>
      </ProfilePanel>

      <DeactivateAccountDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      />
    </>
  );
}
