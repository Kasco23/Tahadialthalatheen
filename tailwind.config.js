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
        // Legacy CSS variables for dynamic theme colors
        'tc-primary': 'var(--tc-primary, #22c55e)',
        'tc-secondary': 'var(--tc-secondary, #38bdf8)',
        'tc-accent': 'var(--tc-accent, #6a5acd)',

        // New theme system tokens
        'theme-primary': 'var(--theme-primary, #22c55e)',
        'theme-secondary': 'var(--theme-secondary, #38bdf8)',
        'theme-accent': 'var(--theme-accent, #6a5acd)',

        'theme-bg-primary': 'var(--theme-bg-primary, #0f172a)',
        'theme-bg-secondary': 'var(--theme-bg-secondary, #1e293b)',
        'theme-surface': 'var(--theme-surface, #334155)',

        'theme-text': 'var(--theme-text, #f8fafc)',
        'theme-text-muted': 'var(--theme-text-muted, #94a3b8)',
        'theme-text-inverse': 'var(--theme-text-inverse, #0f172a)',

        'theme-border': 'var(--theme-border, rgba(148, 163, 184, 0.2))',
        'theme-focus-ring': 'var(--theme-focus-ring, #22c55e)',

        'theme-success': 'var(--theme-success, #10b981)',
        'theme-warning': 'var(--theme-warning, #f59e0b)',
        'theme-error': 'var(--theme-error, #ef4444)',

        // Theme color scales
        'theme-primary-50': 'var(--theme-primary-50, #f0fdf4)',
        'theme-primary-100': 'var(--theme-primary-100, #dcfce7)',
        'theme-primary-200': 'var(--theme-primary-200, #bbf7d0)',
        'theme-primary-300': 'var(--theme-primary-300, #86efac)',
        'theme-primary-400': 'var(--theme-primary-400, #4ade80)',
        'theme-primary-500': 'var(--theme-primary-500, #22c55e)',
        'theme-primary-600': 'var(--theme-primary-600, #16a34a)',
        'theme-primary-700': 'var(--theme-primary-700, #15803d)',
        'theme-primary-800': 'var(--theme-primary-800, #166534)',
        'theme-primary-900': 'var(--theme-primary-900, #14532d)',

        'theme-secondary-50': 'var(--theme-secondary-50, #f0f9ff)',
        'theme-secondary-100': 'var(--theme-secondary-100, #e0f2fe)',
        'theme-secondary-200': 'var(--theme-secondary-200, #bae6fd)',
        'theme-secondary-300': 'var(--theme-secondary-300, #7dd3fc)',
        'theme-secondary-400': 'var(--theme-secondary-400, #38bdf8)',
        'theme-secondary-500': 'var(--theme-secondary-500, #0ea5e9)',
        'theme-secondary-600': 'var(--theme-secondary-600, #0284c7)',
        'theme-secondary-700': 'var(--theme-secondary-700, #0369a1)',
        'theme-secondary-800': 'var(--theme-secondary-800, #075985)',
        'theme-secondary-900': 'var(--theme-secondary-900, #0c4a6e)',

        'theme-accent-50': 'var(--theme-accent-50, #f5f3ff)',
        'theme-accent-100': 'var(--theme-accent-100, #ede9fe)',
        'theme-accent-200': 'var(--theme-accent-200, #ddd6fe)',
        'theme-accent-300': 'var(--theme-accent-300, #c4b5fd)',
        'theme-accent-400': 'var(--theme-accent-400, #a78bfa)',
        'theme-accent-500': 'var(--theme-accent-500, #8b5cf6)',
        'theme-accent-600': 'var(--theme-accent-600, #7c3aed)',
        'theme-accent-700': 'var(--theme-accent-700, #6d28d9)',
        'theme-accent-800': 'var(--theme-accent-800, #5b21b6)',
        'theme-accent-900': 'var(--theme-accent-900, #4c1d95)',
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
