'use client';

import {
  ProfilePanel,
  ProfileStatTile,
} from '@/components/profile/ProfileShell';

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
  return (
    <ProfilePanel
      eyebrow="Campus"
      title="Academic Details"
      description="A tidy snapshot of the details tied to your archive account."
      accentClassName="bg-[#d9ddff]"
      contentClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"
    >
      <ProfileStatTile
        label="Student ID"
        value={studentId ?? 'Pending'}
        className="bg-white"
      />
      <ProfileStatTile
        label="Program"
        value={program ?? 'Pending'}
        className="bg-[#fffaf0]"
      />
      <ProfileStatTile
        label="Batch"
        value={batch != null ? `Batch ${batch}` : 'Pending'}
        className="bg-[#f2fbff]"
      />
      <ProfileStatTile
        label="Status"
        value={
          status === 'ALUMNI'
            ? 'Alumni'
            : status === 'STUDENT'
              ? 'Student'
              : 'Pending'
        }
        className="bg-[#fff8fb]"
      />
    </ProfilePanel>
  );
}
