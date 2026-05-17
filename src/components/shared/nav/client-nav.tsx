'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ClientNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/gallery', label: 'Gallery' },
    { href: '/map', label: 'Map' },
    { href: '/about', label: 'About' },
  ];

  return (
    <div className="flex gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`transition-colors ${
            pathname === item.href
              ? 'text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
