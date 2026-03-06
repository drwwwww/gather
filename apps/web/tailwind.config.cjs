const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "Arial", "sans-serif"]
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        border: "var(--border)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        primary: "var(--primary)",
        primaryHover: "var(--primary-hover)",
        primaryPressed: "var(--primary-pressed)",
        primarySoft: "var(--primary-soft)",
        primaryRing: "var(--primary-ring)",
        success: "var(--success)",
        successSoft: "var(--success-soft)",
        warning: "var(--warning)",
        warningSoft: "var(--warning-soft)",
        danger: "var(--danger)",
        dangerSoft: "var(--danger-soft)",
        info: "var(--info)",
        infoSoft: "var(--info-soft)"
      }
    }
  },
  plugins: [],
};

module.exports = config;
