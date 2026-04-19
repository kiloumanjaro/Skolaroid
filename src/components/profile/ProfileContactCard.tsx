'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProfileContactCardProps {
  phone?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  contactOther?: string | null;
}

interface ContactRow {
  label: string;
  value?: string | null;
  href?: string;
}

export function ProfileContactCard({
  phone,
  linkedinUrl,
  facebookUrl,
  contactOther,
}: ProfileContactCardProps) {
  const contactRows: ContactRow[] = [
    { label: 'Phone', value: phone },
    { label: 'LinkedIn', value: linkedinUrl, href: linkedinUrl ?? undefined },
    { label: 'Facebook', value: facebookUrl, href: facebookUrl ?? undefined },
    { label: 'Other', value: contactOther, href: contactOther ?? undefined },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {contactRows.map(({ label, value, href }) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground/70">
                {label}
              </span>
              {value ? (
                href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-[60%] truncate font-hand text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="font-hand text-sm text-foreground/80">
                    {value}
                  </span>
                )
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not provided
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
