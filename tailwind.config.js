/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      serif: ['"Libre Baskerville"', '"Times New Roman"', "ui-serif", "serif"],
    },
    extend: {
      boxShadow: {
        sm: "0 0 0 1px #1d2430",
      },
      borderColor: {
        DEFAULT: "#232a36",
      },
      // Dunkles E1-Farbschema: die Standard-Stufen werden bewusst umgedeutet,
      // "white" ist die Kartenfarbe, "blue" ist das E1-Gold, "slate" die Neutraltöne.
      colors: {
        white: "#12161e",
        slate: {
          50: "#0f131a",
          100: "#0b0d12",
          200: "#232a36",
          300: "#323a49",
          400: "#7d8696",
          500: "#9aa3b2",
          600: "#b4bbc7",
          700: "#cfd3da",
          800: "#e9e4d3",
          900: "#f4f1e8",
        },
        blue: {
          200: "#6b5a1f",
          500: "#c9a227",
          600: "#c9a227",
          700: "#e0bb45",
        },
        orange: {
          50: "#2a1d10",
          100: "#3a2512",
          200: "#5a3a18",
          500: "#e8892b",
          600: "#f0a35a",
          700: "#f5b878",
        },
        red: {
          50: "#2a1416",
          100: "#3a181b",
          200: "#5a2428",
          500: "#e5534b",
          600: "#ef6a62",
          700: "#f28b85",
          800: "#f5a8a3",
        },
        green: {
          50: "#10261a",
          100: "#143322",
          200: "#1f5236",
          500: "#3fb97a",
          600: "#4cc98a",
          700: "#6ed9a3",
        },
        amber: {
          50: "#2a2210",
          200: "#5a4818",
          900: "#f1d98a",
        },
        e1: {
          gold: "#c9a227",
          cream: "#f4f1e8",
          night: "#0b0d12",
        },
      },
    },
  },
  plugins: [],
};
