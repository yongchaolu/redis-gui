/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coal: '#0F172A',
        panel: '#1E293B',
        panel2: '#2D3748',
        ink: '#F8FAFC',
        mute: '#94A3B8',
        redis: '#DC2626',
        cyanx: '#3B82F6',
        amberx: '#F59E0B',
        greenx: '#10B981',
        border: '#334155',
        surfaceHigh: '#334155',
        surfaceHighest: '#475569',
      },
      boxShadow: {
        glow: '0 0 36px rgba(59, 130, 246, .16)',
        danger: '0 0 34px rgba(220, 38, 38, .20)',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '0.75rem',
        '2xl': '0.75rem',
        '3xl': '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
