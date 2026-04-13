import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        /* Unilever Beauty / Clinical palette */
        "clinical-white": "#FFFFFF",
        "unilever-blue": "#002D72",
        "ponds-blush": "#FCE4EC",
        "simple-green": "#84C254",
        "scanner-cyan": "#00E5FF",
        
        // Aliases to avoid breaking everything immediately before refactoring finishes
        alabaster: "#FFFFFF",
        charcoal: "#002D72",
        bordeaux: "#002D72",
        champagne: "#FCE4EC",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.08)",
        floating: "0 10px 40px rgba(0, 0, 0, 0.12)",
      },
      backdropBlur: {
        glass: "12px",
        "glass-lg": "20px",
      },
      borderRadius: {
        "btn": "9999px",
        "input": "1rem",
        "card": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
