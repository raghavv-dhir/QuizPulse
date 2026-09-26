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
        canvas: '#F8F8F6',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F4F4F1',
          hover: '#EDEDEA',
          border: '#E5E5E2',
          borderDark: '#D4D4D0',
        },
        ink: {
          DEFAULT: '#171717',
          secondary: '#4A4A4A',
          muted: '#6B6B6B',
          faint: '#9E9E9E',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#1D4ED8',
        },
        semantic: {
          success: '#16803C',
          'success-subtle': '#ECFDF3',
          warning: '#A16207',
          'warning-subtle': '#FEFCE8',
          error: '#C62828',
          'error-subtle': '#FEF2F2',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        dropdown: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        modal: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
