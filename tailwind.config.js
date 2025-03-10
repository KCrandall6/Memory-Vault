/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'vault-blue': '#1E3A5F', // Dark blue from your logo
          'vault-yellow': '#FFB800', // Yellow accent from your logo
          'vault-gray': '#8B9EB0', // Light gray from your logo
        }
      },
    },
    plugins: [],
  }