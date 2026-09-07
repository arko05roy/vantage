import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: {
          DEFAULT: '#ffffff',
          dim: '#f1f5f9',
          border: '#e2e8f0',
        },
        primary: {
          DEFAULT: '#004532',
          container: '#065f46',
          fixed: '#a6f2d1',
          light: '#ecfdf5',
          dark: '#002b1f',
        },
        secondary: {
          DEFAULT: '#006c49',
          container: '#10b981',
          light: '#d1fae5',
        },
        tertiary: {
          DEFAULT: '#563400',
          container: '#f59e0b',
          light: '#fef3c7',
        },
        slate: {
          850: '#151f30',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        headline: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.08)',
        glow: '0 0 20px -3px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
