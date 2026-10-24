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
        background: '#111111',
        foreground: '#F5F5F7',
        'ios-gray': {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          light: 'rgba(255, 255, 255, 0.12)',
          dark: 'rgba(255, 255, 255, 0.04)',
        },
        'apple-blue': '#0A84FF',
        'apple-green': '#30D158',
        'apple-silver': '#8E8E93',
      },
      borderRadius: {
        'ios': '24px',
        'ios-sm': '16px',
        'ios-lg': '32px',
      },
      boxShadow: {
        'ios-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'ios-bubble': '0 2px 10px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
