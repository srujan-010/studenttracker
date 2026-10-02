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
        institutional: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Core Primary Accent
          700: '#1d4ed8',
          800: '#1e40af', // Deep Header Blue
          900: '#1e3a8a',
          950: '#172554',
        },
        slate: {
          850: '#151f30',
        },
      },
    },
  },
  plugins: [],
};

export default config;
