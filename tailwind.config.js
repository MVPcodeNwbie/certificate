/**
 * Tailwind Design System Configuration
 * --------------------------------------------------
 * We introduce semantic color scales (brand, success, warning, danger, info, neutral)
 * to reduce ad-hoc use of raw Tailwind palette classes across the app. The legacy
 * "primary" (blue) scale is kept temporarily for backwards compatibility; new code
 * should prefer the semantic tokens. A gradual migration can replace instances of
 * bg-primary-* with bg-brand-* or a variant that matches the intended meaning.
 */
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Legacy palette (blue) – slated for removal after migration
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        // Semantic palettes
        brand: colors.green,          // primary brand hue
        success: colors.emerald,      // success / positive
        warning: colors.amber,        // warnings / caution
        danger: colors.red,           // errors / destructive
        info: colors.sky,             // informational accents
        neutral: colors.gray,         // neutral surfaces & text
        accent: colors.orange         // supporting accent (used in gradients)
      },
      boxShadow: {
        'focus-brand': '0 0 0 2px rgb(255 255 255), 0 0 0 4px rgb(22 163 74 / 0.6)'
      },
      borderRadius: {
        'button': '0.55rem'
      },
      backgroundColor: {
        'surface': 'rgb(255 255 255 / <alpha-value>)',
        'surface-muted': 'rgb(249 250 251 / <alpha-value>)',
        'surface-inverse': 'rgb(24 24 27 / <alpha-value>)'
      },
      textColor: {
        'on-surface': 'rgb(17 24 39 / <alpha-value>)',
        'on-surface-muted': 'rgb(75 85 99 / <alpha-value>)',
        'on-surface-inverse': 'rgb(243 244 246 / <alpha-value>)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Utility variants for semantic intent (optional future extension)
    function addSemanticUtilities({ addComponents, theme }) {
      addComponents({
        '.btn-base': {
          '@apply inline-flex items-center justify-center font-medium leading-none select-none transition duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-button': {}
        },
        '.btn-primary': {
          '@apply btn-base bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500': {}
        },
        '.btn-danger': {
          '@apply btn-base bg-danger-600 hover:bg-danger-500 active:bg-danger-700 text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-danger-500': {}
        },
        '.btn-outline': {
          '@apply btn-base border border-neutral-300 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500': {}
        }
      });
    }
  ]
};
