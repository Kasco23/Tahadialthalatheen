/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#6a5acd', // violet
        accent2: '#38bdf8', // blue
        glass: 'rgba(30,32,60,0.8)',
        'brand-dark': '#0f172a', // darker slate for better contrast
        'brand-grad': '#22c55e', // green primary (football field color)
        'brand-light': '#f8fafc', // lighter text
        'accent-blue': '#0ea5e9', // sky blue
        'accent-green': '#10b981', // emerald green
        'accent-orange': '#f59e0b', // amber orange
        'football-green': '#22c55e', // football field green
        'football-dark': '#15803d', // darker green
        'card-bg': 'rgba(15, 23, 42, 0.8)', // dark transparent cards
        'card-border': 'rgba(148, 163, 184, 0.2)', // subtle borders
        // CSS variables for dynamic theme colors
        'tc-primary': 'var(--tc-primary, #22c55e)',
        'tc-secondary': 'var(--tc-secondary, #38bdf8)',
        'tc-accent': 'var(--tc-accent, #6a5acd)',
      },
      fontFamily: {
        arabic: ['"Noto Naskh Arabic"', 'Tajawal', 'Arial', 'sans-serif'],
        header: ['DG Bebo', 'sans-serif'],
        body: ['Almarai', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
