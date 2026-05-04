import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/utils/require-admin';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const result = await requireAdmin();

  if ('error' in result) {
    redirect('/');
  }

  return children;
}
