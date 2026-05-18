import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        dancing: ['var(--font-dancing)'],
        kalam: ['var(--font-kalam)'],
        hand: ['var(--font-hand)'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'skolaroid-blue': '#3F83DB',
        postit: 'hsl(var(--postit))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translate(-50%, -1rem)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        btnBobOpen: {
          '0%': {
            transform: 'translateY(0)',
            opacity: '1',
            animationTimingFunction: 'ease-in',
          },
          '8%': {
            transform: 'translateY(4px)',
            opacity: '1',
            animationTimingFunction: 'ease-out',
          },
          '22%': {
            transform: 'translateY(-14px)',
            opacity: '1',
            animationTimingFunction: 'ease-in',
          },
          '78%': { transform: 'translateY(60px)', opacity: '1' },
          '100%': { transform: 'translateY(76px)', opacity: '0' },
        },
        btnBounceBack: {
          '0%': { transform: 'translateY(72px)', opacity: '0' },
          '45%': { transform: 'translateY(-15px)', opacity: '1' },
          '65%': { transform: 'translateY(3px)', opacity: '1' },
          '82%': { transform: 'translateY(-8px)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-down': 'slideDown 0.35s ease-out',
        'btn-bob-open': 'btnBobOpen 0.4s ease-in both',
        'btn-bounce-back': 'btnBounceBack 0.5s ease-out both',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
