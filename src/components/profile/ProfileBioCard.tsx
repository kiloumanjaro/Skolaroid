'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProfileBioCardProps {
  bio?: string | null;
}

export function ProfileBioCard({ bio }: ProfileBioCardProps) {
  return (
    <Card style={{ borderRadius: '1rem' }}>
      <CardHeader>
        <CardTitle className="text-base">About Me</CardTitle>
      </CardHeader>
      <CardContent>
        {bio ? (
          <p className="whitespace-pre-wrap font-hand text-sm leading-relaxed text-foreground/80">
            {bio}
          </p>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-center">
            <p className="text-sm italic text-muted-foreground">
              No bio added yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
