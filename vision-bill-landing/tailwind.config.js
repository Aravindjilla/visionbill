/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4ade80", // Mint/Emerald 400 (Growth/Money)
          dark: "#22c55e",    // Green 500
          light: "#86efac",   // Green 300
        },
        secondary: {
          DEFAULT: "#38bdf8", // Sky 400 (Trust/Vision)
          dark: "#0ea5e9",    // Sky 500
        },
        surface: "#050505",  // Matte Black
        card: "#0f172a",     // Slate 900
        border: "rgba(255, 255, 255, 0.1)",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
