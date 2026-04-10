'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';

export function ProfileSettingsCard() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
              id="delete-account-trigger"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="w-fit border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
