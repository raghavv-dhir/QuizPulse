/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: '#F8FAFC',
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          DEFAULT: '#4F46E5',
        },
        game: {
          red: {
            DEFAULT: '#EF4444',
            hover: '#DC2626',
            light: '#FEF2F2',
          },
          blue: {
            DEFAULT: '#0EA5E9',
            hover: '#0284C7',
            light: '#F0F9FF',
          },
          amber: {
            DEFAULT: '#F59E0B',
            hover: '#D97706',
            light: '#FFFBEB',
          },
          green: {
            DEFAULT: '#10B981',
            hover: '#059669',
            light: '#ECFDF5',
          },
          purple: {
            DEFAULT: '#8B5CF6',
            hover: '#7C3AED',
            light: '#F5F3FF',
          }
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
        glow: '0 0 20px -3px rgba(79, 70, 229, 0.25)',
        pop: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
