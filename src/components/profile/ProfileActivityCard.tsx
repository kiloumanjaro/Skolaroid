'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ProfileActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs italic text-muted-foreground">
          Activity feed coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
