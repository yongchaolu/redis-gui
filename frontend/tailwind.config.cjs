/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coal: '#0b1014',
        panel: '#111922',
        panel2: '#172331',
        ink: '#d8e3ea',
        mute: '#7f92a3',
        redis: '#d93f32',
        cyanx: '#40d7ff',
        amberx: '#ffbd5a',
        greenx: '#74f0a7',
      },
      boxShadow: {
        glow: '0 0 36px rgba(64, 215, 255, .16)',
        danger: '0 0 34px rgba(217, 63, 50, .20)',
      },
    },
  },
  plugins: [],
};
