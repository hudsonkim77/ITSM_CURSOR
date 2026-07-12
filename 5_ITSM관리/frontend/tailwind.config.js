/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bcd0ff",
          300: "#8fb0ff",
          400: "#5b84fa",
          500: "#3a5eef",
          600: "#2743d4",
          700: "#2135ab",
          800: "#1f2f87",
          900: "#1e2c6d",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        pop: "0 10px 30px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
};
