const config = {
  darkMode: ["class"],
  daisyui: {
    themes: [
      [
        "gather",
        {
          "base-100": "oklch(96% 0.002 17.2)",
          "base-200": "oklch(92.2% 0.005 34.3)",
          "base-300": "oklch(90% 0.006 34.3)",
          "base-content": "#111827",
          "primary": "oklch(82.8% 0.189 84.429)",
          "primary-content": "#ffffff",
          "secondary": "#ffffff",
          "accent": "oklch(96.2% 0.059 95.617)",
          "neutral": "#4b5563",
          "info": "oklch(62.3% 0.214 259.815)",
          "success": "oklch(72.3% 0.219 149.579)",
          "warning": "oklch(70.5% 0.213 47.604)",
          "error": "oklch(57.7% 0.245 27.325)",
        },
      ],
    ],
    defaultTheme: "gather",
  },
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "Arial", "sans-serif"],
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
        infoSoft: "var(--info-soft)",
      },
    },
  },
  plugins: [require("daisyui")],
};

module.exports = config;
