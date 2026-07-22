/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        data: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        goa: {
          primary: "#C8862B",
          "primary-content": "#1B140A",
          secondary: "#2B6F76",
          "secondary-content": "#EAF4F4",
          accent: "#A63D2F",
          "accent-content": "#FCEEEA",
          neutral: "#16233F",
          "neutral-content": "#F1ECDF",
          "base-100": "#FBF8F1",
          "base-200": "#F1ECDF",
          "base-300": "#E3DBC7",
          "base-content": "#1E2430",
          info: "#2B6F76",
          success: "#3F7A52",
          warning: "#C8862B",
          error: "#A63D2F",
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
        },
      },
    ],
  },
};