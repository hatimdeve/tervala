/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Russo One"', 'sans-serif'],
        'space': ['"Space Grotesk"', 'sans-serif'],
        'russo': ['"Russo One"', 'sans-serif'],
      },
      colors: {
        // Light mode
        light: {
          background: '#ffffff',
          text: '#1a1a1a',
          primary: '#3b82f6',
        },
        // Dark mode
        dark: {
          background: '#1a1a1a',
          text: '#ffffff',
          primary: '#60a5fa',
        }
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'progress': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'gradient-x': 'gradient-x 3s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
        'progress': 'progress 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
