'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Replaced DeleteAccountDialog with DeactivateAccountDialog
import { DeactivateAccountDialog } from '@/components/profile/DeactivateAccountDialog';

export function ProfileSettingsCard() {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-fit cursor-not-allowed opacity-50"
            >
              Change Password
            </Button>
            <p className="text-xs text-muted-foreground">
              Password change is not available yet.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              id="deactivate-account-trigger"
              variant="outline"
              size="sm"
              onClick={() => setShowDeactivateDialog(true)}
              className="w-fit border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Deactivate Account
            </Button>
            <p className="text-xs text-muted-foreground">
              Deactivate your account. You have 30 days to reactivate before
              permanent deletion.
            </p>
          </div>
        </CardContent>
      </Card>

      <DeactivateAccountDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      />
    </>
  );
}
