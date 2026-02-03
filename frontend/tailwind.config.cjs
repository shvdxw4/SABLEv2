/** @type {import('tailwindcss').Config} */
 module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sable: {
          bg: "#0b0b0c",
          panel: "#111113",
          border: "#232326",
          text: "#f3f3f4",
          muted: "#b6b6bb",
          heat: "#ff5a3c",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

