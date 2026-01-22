/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme matching reference designs
        'dark': {
          900: '#0f1419',
          800: '#151c24',
          700: '#1c2834',
          600: '#243141',
          500: '#2d3e50',
        },
        'accent': {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          green: '#22c55e',
          orange: '#f97316',
          purple: '#8b5cf6',
          pink: '#ec4899',
          yellow: '#eab308',
          red: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
