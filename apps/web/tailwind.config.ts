import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(222.2, 84%, 4.9%)', // Deep Space Navy
        foreground: 'hsl(210, 40%, 98%)',
        card: 'rgba(15, 23, 42, 0.65)',      // Glass Card
        border: 'rgba(255, 255, 255, 0.08)',
        accent: {
          blue: '#3b82f6',
          violet: '#8b5cf6',
          teal: '#14b8a6',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
