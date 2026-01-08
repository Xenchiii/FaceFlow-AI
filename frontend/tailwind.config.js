/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom palette
        primary: '#F6F6F6',   // Background
        secondary: '#7986C7', // Main Brand
        accent: '#F73F52',    // Alerts
        tertiary: '#FFEA85',  // Warnings
        dark: '#1F2937',      // Text
      },
      fontFamily: {
        // Inter for body text, Poppins for headers
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}