/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0d172a',
          900: '#15233e',
          800: '#1B2C4E', // Exact corporate navy sidebar
          700: '#243a65',
          600: '#324e86',
        },
        teal: {
          900: '#064E57',
          800: '#0A7380', // Dark teal accent
          700: '#0E8592',
          600: '#13979B', // Primary teal accent
          500: '#17B2B7',
          400: '#2DD4BF',
          100: '#CCFBF1',
          50: '#F0FDFA',
        },
        card: {
          DEFAULT: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(15, 23, 42, 0.05), 0 1px 4px -1px rgba(15, 23, 42, 0.03)',
        'card': '0 4px 20px -2px rgba(27, 44, 78, 0.06), 0 2px 6px -1px rgba(27, 44, 78, 0.03)',
      }
    },
  },
  plugins: [],
}
