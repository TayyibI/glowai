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
        /* GlowAI rebrand – strict 5-color palette */
        blush: "#F4ACB7",   // Primary CTA, scanner laser, active states, progress bars
        white: "#FFFFFF",   // Glass cards, inputs, button text on dark
        ivory: "#FFF5E4",   // Main site background, section dividers
        nude: "#FFD6BA",   // Secondary buttons, hover, soft borders, highlights
        brown: "#6B4F4F",   // Primary text, headings, icons, footer, high-contrast (no black)
      },
      boxShadow: {
        "blush-glow": "0 0 20px rgba(244, 172, 183, 0.6), 0 0 40px rgba(244, 172, 183, 0.3)",
        "blush-soft": "0 4px 12px rgba(244, 172, 183, 0.2)",
        "card": "0 2px 8px rgba(107, 79, 79, 0.08)",
        "glass": "0 8px 32px rgba(107, 79, 79, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
      },
      backdropBlur: {
        glass: "12px",
        "glass-lg": "20px",
      },
      borderRadius: {
        "btn": "8px",
        "input": "8px",
        "card": "12px",
      },
    },
  },
  plugins: [],
};

export default config;
