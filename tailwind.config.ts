import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        /* Design system – design.json */
        glow: {
          rose: "#e8a4b8",
          mauve: "#c9a0b8",
          cream: "#f5e6e0",
          deep: "#2d1b2e",
          soft: "#faf5f7",
        },
        dash: {
          "bg-primary": "#f8f9fa",
          surface: "#ffffff",
          "text-primary": "#343a40",
          "text-secondary": "#6c757d",
          "text-tertiary": "#adb5bd",
          "text-positive": "#6dd47b",
          "text-negative": "#d0021b",
          "text-link": "#5c8ffc",
          "brand-blue": "#5c8ffc",
          "brand-green": "#6dd47b",
          "brand-orange": "#f5a623",
          "brand-red": "#d0021b",
          "brand-light-blue": "#4a90e2",
          "brand-yellow": "#ffc107",
          border: "#dee2e6",
        },
      },
      boxShadow: {
        "dash-soft": "0 4px 12px rgba(0, 0, 0, 0.08)",
        "dash-card": "0 2px 8px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        "dash-sm": "6px",
        "dash-button": "8px",
        "dash-input": "8px",
        "dash-card": "12px",
      },
      spacing: {
        "dash-card": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
