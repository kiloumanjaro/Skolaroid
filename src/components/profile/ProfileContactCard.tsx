'use client';

import { ProfilePanel } from '@/components/profile/profile-shell';

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
  toneClassName: string;
}

export function ProfileContactCard({
  phone,
  linkedinUrl,
  facebookUrl,
  contactOther,
}: ProfileContactCardProps) {
  const contactRows: ContactRow[] = [
    {
      label: 'Phone',
      value: phone,
      toneClassName: 'bg-white',
    },
    {
      label: 'LinkedIn',
      value: linkedinUrl,
      href: linkedinUrl ?? undefined,
      toneClassName: 'bg-[#f2fbff]',
    },
    {
      label: 'Facebook',
      value: facebookUrl,
      href: facebookUrl ?? undefined,
      toneClassName: 'bg-[#fff8fb]',
    },
    {
      label: 'Other',
      value: contactOther,
      href: contactOther ?? undefined,
      toneClassName: 'bg-[#fffaf0]',
    },
  ];

  return (
    <ProfilePanel
      eyebrow=""
      title="Contact Deck"
      description="Keep your links handy so batchmates know where to reach you."
      accentClassName="bg-[#d6f5df]"
      contentClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"
    >
      {contactRows.map(({ label, value, href, toneClassName }) => (
        <div
          key={label}
          className={`border-2 border-border px-4 py-3 ${toneClassName}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/65">
            {label}
          </p>
          <div className="mt-2 break-words font-hand text-sm leading-6 text-foreground/85">
            {value ? (
              href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-4"
                >
                  {value}
                </a>
              ) : (
                value
              )
            ) : (
              <span className="italic text-muted-foreground">Not provided</span>
            )}
          </div>
        </div>
      ))}
    </ProfilePanel>
  );
}
