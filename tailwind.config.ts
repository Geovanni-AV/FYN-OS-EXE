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
        primary: { 
          DEFAULT: '#0058bc', 
          hover: '#004493', 
          light: '#d8e2ff', 
          dark: '#69daff' 
        },
        success: { DEFAULT: '#006e28', light: '#e1ffec' },
        warning: { DEFAULT: '#bc6c00', light: '#fff4e5' },
        danger:  { DEFAULT: '#bc000a', light: '#ffdad5' },
        atelier: {
          bg: {
            light: '#faf9fe',
            dark: '#0e0e0f'
          },
          surface: {
            light: '#f4f3f8',
            dark: '#131314'
          },
          card: {
            light: '#ffffff',
            dark: '#1c1c1e'
          },
          'text-main': {
            light: '#1a1b1f',
            dark: '#ffffff'
          },
          'text-muted': {
            light: '#717786',
            dark: '#adaaab'
          }
        },
        // Mantenemos compatibilidad con clases antiguas mapeando a los nuevos tokens
        light: {
          bg:       '#faf9fe',
          card:     '#ffffff',
          surface:  '#f4f3f8',
          border:   'transparent', 
          muted:    '#717786',
          text:     '#1a1b1f',
          'text-2': '#414755',
        },
        dark: {
          bg:       '#0e0e0f',
          card:     '#1c1c1e',
          surface:  '#131314',
          border:   'transparent',
          muted:    '#adaaab',
          text:     '#ffffff',
          'text-2': '#adaaab',
        },
      },
      borderRadius: {
        card:  '16px',
        btn:   '999px',
        badge: '999px',
      },
      boxShadow: {
        'luster': '0 40px 80px -20px rgba(0,0,0,0.04)',
        'luster-dark': '0 40px 80px -20px rgba(0,0,0,0.4)',
        card:      '0 4px 24px -2px rgba(0,0,0,0.04)',
        'card-dark': '0 4px 24px -2px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':   'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config
