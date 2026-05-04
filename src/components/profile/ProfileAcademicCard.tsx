'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProfileAcademicCardProps {
  studentId?: string | null;
  program?: string | null;
  batch?: number | null;
  status?: 'STUDENT' | 'ALUMNI' | null;
}

export function ProfileAcademicCard({
  studentId,
  program,
  batch,
  status,
}: ProfileAcademicCardProps) {
  const rows = [
    { label: 'Student ID', value: studentId ?? '—' },
    { label: 'Program', value: program ?? '—' },
    { label: 'Batch', value: batch != null ? String(batch) : '—' },
    {
      label: 'Status',
      value:
        status === 'ALUMNI' ? 'Alumni' : status === 'STUDENT' ? 'Student' : '—',
    },
  ];

  return (
    <Card style={{ borderRadius: '1rem' }}>
      <CardHeader>
        <CardTitle className="text-base">Academic Details</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {rows.map(({ label, value }) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground/70">
                {label}
              </span>
              <span className="text-sm text-muted-foreground">{value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
