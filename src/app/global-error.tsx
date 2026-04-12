'use client';

import { Patrick_Hand } from 'next/font/google';

const patrickHand = Patrick_Hand({
  variable: '--font-hand',
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
});

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        className={`${patrickHand.className} ${patrickHand.variable} antialiased`}
        style={{
          backgroundColor: '#fdfbf7',
          backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          color: '#2d2d2d',
          fontFamily: 'var(--font-hand), sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '3px solid #2d2d2d',
            boxShadow: '6px 6px 0px 0px #2d2d2d',
            borderRadius: '4px',
            padding: '2.5rem 3rem',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '3rem',
              lineHeight: 1,
              marginBottom: '1rem',
              userSelect: 'none',
            }}
          >
            ⚠️
          </p>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: '#6b6560',
              marginBottom: '2rem',
              fontSize: '1rem',
            }}
          >
            An unexpected error occurred. Try refreshing, or go back to the home
            page.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                backgroundColor: '#3F83DB',
                color: '#ffffff',
                border: '3px solid #2d2d2d',
                boxShadow: '4px 4px 0px 0px #2d2d2d',
                borderRadius: '4px',
                padding: '0.5rem 1.25rem',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow = '2px 2px 0px 0px #2d2d2d';
                el.style.transform = 'translate(2px, 2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow = '4px 4px 0px 0px #2d2d2d';
                el.style.transform = 'translate(0, 0)';
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                backgroundColor: '#ffffff',
                color: '#2d2d2d',
                border: '3px solid #2d2d2d',
                boxShadow: '4px 4px 0px 0px #2d2d2d',
                borderRadius: '4px',
                padding: '0.5rem 1.25rem',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow = '2px 2px 0px 0px #2d2d2d';
                el.style.transform = 'translate(2px, 2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow = '4px 4px 0px 0px #2d2d2d';
                el.style.transform = 'translate(0, 0)';
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
