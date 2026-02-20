import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
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
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "gather-light-clean": {
          "color-scheme": "light",
            "base-100": "oklch(99.9% 0.001 95)", // ultra white
            "base-200": "oklch(99.7% 0.001 93)", // ultra white, subtle difference
            "base-300": "oklch(99.3% 0.001 90)", // very subtle, nearly white gray for sidebar
          "base-content": "oklch(18% 0.01 60)",
          "primary": "oklch(74% 0.13 75)",
          "primary-content": "oklch(15% 0.02 75)",
          "secondary": "#CACAAA",
          "secondary-content": "#1F1A14",
          "accent": "#B7C7B0", // gentle sage accent (optional)
          "accent-content": "#1F1A14",
          "neutral": "#1F1A14",
          "neutral-content": "#FFF8ED",
          "success": "#4F7A5A",
          "warning": "#D4A73D",
          "error": "#B84C3A",
          "info": "#3A6F8F",
          "border": "oklch(93.5% 0.015 80)",
          "--rounded-box": "1rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1rem",
          "--border-btn": "1px"
        }
      },
      {
        "gather-warm": {
          "color-scheme": "light",
          "base-100": "#F8F4ED",
          "base-200": "#F3EBDD",
          "base-300": "#ECE2D1",
          "base-content": "#1F1A14",
          "primary": "#C48A2A",
          "primary-content": "#FFF8ED",
          "secondary": "#CACAAA",
          "secondary-content": "#1F1A14",
          "accent": "#F0CA8F",
          "accent-content": "#1F1A14",
          "neutral": "#1F1A14",
          "neutral-content": "#FFF8ED",
          "success": "#4F7A5A",
          "warning": "#D4A73D",
          "error": "#B84C3A",
          "info": "#3A6F8F",
          "border": "rgba(60,40,20,0.12)",
          "--rounded-box": "1rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1rem",
          "--border-btn": "1px"
        }
      }
    ]
  }
};

export default config;
