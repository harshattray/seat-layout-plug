/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'text-sky-600',       // Keep original for reference if needed
    '!text-sky-600',      // Added for !important diagnostic
    'border-sky-600',
    'hover:bg-sky-600',
    'hover:!text-white',  // Ensure this is the one present
    // You can add other colors here if needed in the future
    // e.g., 'text-slate-500', 'border-slate-500', 'hover:bg-slate-500'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}