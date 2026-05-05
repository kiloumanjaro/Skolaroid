import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const profileFlatButtonClass =
  'rounded-none shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none';

export function ProfilePanel({
  eyebrow,
  title,
  description,
  accentClassName = 'bg-[#c0f7fe]',
  headerContent,
  contentClassName,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  eyebrow: string;
  title: string;
  description?: string;
  accentClassName?: string;
  headerContent?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden border-2 border-border bg-card text-card-foreground shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-4 border-b-2 border-border px-5 py-4',
          accentClassName
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-kalam text-xl font-bold text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-[48ch] text-sm leading-6 text-foreground/75">
              {description}
            </p>
          ) : null}
        </div>
        {headerContent ? <div className="shrink-0">{headerContent}</div> : null}
      </div>
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  );
}

export function ProfileStatTile({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        'border-2 border-border bg-background px-4 py-3',
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/65">
        {label}
      </p>
      <div
        className={cn(
          'mt-2 font-kalam text-lg font-bold leading-tight text-foreground',
          valueClassName
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function ProfileSkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse border-2 border-border bg-muted/60',
        className
      )}
    />
  );
}
