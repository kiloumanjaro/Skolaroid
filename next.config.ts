import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent clickjacking — only allow same-origin framing
  { key: 'X-Frame-Options', value: 'DENY' },
  // Legacy XSS filter (still useful for older browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control referrer information sent with requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features the app doesn't need
  {
    key: 'Permissions-Policy',
    value:
      'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',
  },
  // Enforce HTTPS (1 year, include subdomains)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig: NextConfig = {
  cacheComponents: false,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    // Skip the optimizer in development — local Supabase uses plain http://
    // which Next.js can't proxy reliably from a server process.
    // In production the optimizer works fine with the https Supabase URLs.
    unoptimized: isDev,
    remotePatterns: [
      {
        // Supabase Storage public bucket URLs (production)
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Google OAuth profile pictures
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
