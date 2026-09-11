import type { Config } from 'tailwindcss';

/** Design tokens from the Stitch "Emerald Sentinel" theme */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── Stitch palette ─────────────────────────────── */
      colors: {
        primary:    { DEFAULT: '#004532', c: '#065f46', light: '#ecfdf5', dim: '#8bd6b6' },
        surface:    { DEFAULT: '#f7faf6', low: '#f1f4f0', container: '#ecefeb', high: '#e6e9e5', highest: '#e0e3df', bright: '#ffffff' },
        outline:    { DEFAULT: '#6f7973', variant: '#bec9c2' },
        on:         { surface: '#181c1a', 'surface-v': '#3f4944', primary: '#ffffff' },
        error:      { DEFAULT: '#ba1a1a', container: '#ffdad6' },
        amber:      { 50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 600: '#d97706', 900: '#78350f' },
      },
      /* ── Typography ─────────────────────────────────── */
      fontFamily: {
        sans:  ['Manrope', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      /* ── Spacing ─────────────────────────────────────── */
      maxWidth: { container: '80rem' },
      /* ── Shadows ─────────────────────────────────────── */
      boxShadow: {
        card: '0 2px 8px -2px rgba(0,0,0,0.06)',
        'card-md': '0 4px 16px -4px rgba(0,0,0,0.09)',
      },
      /* ── Border radius ───────────────────────────────── */
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md:  '0.625rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
