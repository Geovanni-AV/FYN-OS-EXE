import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#2965ff', hover: '#1e4dd8', light: '#eff6ff', dark: '#1e3a8a' },
        success: { DEFAULT: '#10b981', light: '#d1fae5' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2' },
        dark: {
          bg:       '#09090b', // Deep rich black
          card:     '#18181b', // Slightly elevated zinc
          surface:  '#27272a', // Higher elevation
          border:   '#3f3f46', // Subtle border
          muted:    '#a1a1aa', // Muted text
          text:     '#fafafa', // Primary text
          'text-2': '#d4d4d8', // Secondary text
        },
        light: {
          bg:       '#f8fafc', // Clean off-white bg
          card:     '#ffffff', // Pure white card
          surface:  '#f1f5f9', // Slate surface
          border:   '#e2e8f0', // Soft border
          muted:    '#94a3b8', // Muted text
          text:     '#0f172a', // Dark slate text
          'text-2': '#475569', // Secondary text
        },
      },
      borderRadius: {
        card:  '12px',
        btn:   '8px',
        badge: '6px',
      },
      boxShadow: {
        card:      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up':     'fade-in-up 0.2s ease-out both',
        'scale-in':       'scale-in 0.15s ease-out both',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
