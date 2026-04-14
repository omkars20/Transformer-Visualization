/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0B0D17',
        surface: '#131728',
        border: '#1E2A45',
        primary: '#6366F1',
        secondary: '#06B6D4',
        accent: '#10B981',
        danger: '#EF4444',
        muted: '#64748B',
        text: '#E2E8F0',
      },
      fontFamily: {
        mono: ['Space Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
