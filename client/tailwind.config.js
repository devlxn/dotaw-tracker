/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Включаем поддержку тем через класс
  theme: {
    extend: {
      colors: {
        "dota-blue": "#60a5fa",
        "dota-accent": "#a855f7",
        "dota-red": "#ef4444",
        "dark-bg": "#1e1e2f",
        "dark-card": "#2a1b3d",
        "light-bg": "#f3f4f6",
        "light-card": "#ffffff",
        // Полная палитра gray
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151", // Убедимся, что gray-700 явно указан
          800: "#1f2937",
          900: "#111827",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // Для анимаций
};
