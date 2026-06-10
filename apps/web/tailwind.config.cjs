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
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "on-surface": "var(--on-surface)",
        "outline-variant": "var(--outline-variant)",
        "nav-pill-active": "var(--nav-pill-active-bg)",
        "nav-active": "var(--nav-active-foreground)",
        "sidebar-canvas": "var(--sidebar-canvas)",
        "app-canvas": "var(--app-canvas)",
      },
      boxShadow: {
        organic: "var(--shadow-organic)",
        elevated: "var(--shadow-organic)",
        "elevated-hover": "var(--shadow-elevated-hover)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "mesh-gradient": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        },
        "volunteers-toolbar-reveal": {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "volunteers-strip-reveal": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "volunteers-service-time-reveal": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "mesh-gradient": "mesh-gradient 15s ease infinite",
        "volunteers-toolbar-reveal": "volunteers-toolbar-reveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "volunteers-strip-reveal": "volunteers-strip-reveal 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "volunteers-service-time-reveal": "volunteers-service-time-reveal 0.45s ease-out 0.1s both"
      },
    },
  },
  plugins: [require("daisyui")],
};

module.exports = config;
