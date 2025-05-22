/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0070f3",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#4a5568",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#e53e3e",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f7fafc",
          foreground: "#4a5568",
        },
        accent: {
          DEFAULT: "#f7fafc",
          foreground: "#4a5568",
        },
        input: "#e2e8f0",
      },
    },
  },
  plugins: [],
}; 