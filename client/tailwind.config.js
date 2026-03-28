/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0f172a",
          teal: "#0d9488",
          amber: "#f59e0b",
          coral: "#f97316",
          cloud: "#f8fafc"
        }
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"]
      },
      boxShadow: {
        glow: "0 10px 40px rgba(13, 148, 136, 0.28)"
      }
    }
  },
  plugins: []
};
