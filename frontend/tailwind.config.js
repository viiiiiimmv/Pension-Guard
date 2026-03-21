/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f5f8f4",
        panel: "#ffffff",
        line: "#d7e1e8",
        signal: "#0f766e",
        safe: "#15803d",
        danger: "#dc2626",
        sand: "#b45309",
      },
      boxShadow: {
        frame: "0 24px 64px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at top, rgba(15, 118, 110, 0.16), transparent 38%), radial-gradient(circle at 20% 20%, rgba(180, 83, 9, 0.1), transparent 24%)",
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
