/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        voyage: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          cardHover: '#FCFBF9',
          border: '#EAE6DF',
          borderSubtle: '#F0ECE4',
          dark: '#111827',
          navy: '#0F172A',
          slate: '#334155',
          muted: '#64748B',
          lightMuted: '#94A3B8',
          gold: {
            DEFAULT: '#C5A059',
            light: '#F8F3E8',
            hover: '#B8924B',
            dark: '#8C6C2D',
          },
          blue: {
            DEFAULT: '#1E293B',
            accent: '#2563EB',
            light: '#EFF6FF',
          },
          emerald: {
            DEFAULT: '#0D9488',
            light: '#F0FDFA',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft-xs': '0 1px 3px rgba(18, 24, 38, 0.03), 0 1px 2px rgba(18, 24, 38, 0.02)',
        'soft-sm': '0 2px 8px rgba(18, 24, 38, 0.04), 0 1px 3px rgba(18, 24, 38, 0.02)',
        'soft-md': '0 6px 20px rgba(18, 24, 38, 0.05), 0 2px 6px rgba(18, 24, 38, 0.03)',
        'soft-lg': '0 12px 32px rgba(18, 24, 38, 0.07), 0 4px 12px rgba(18, 24, 38, 0.04)',
        'luxury': '0 20px 50px -12px rgba(17, 24, 39, 0.08)',
        'gold-glow': '0 0 25px -5px rgba(197, 160, 89, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
