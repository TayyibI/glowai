import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "serif"],
      },
      colors: {
        /* Quiet Luxury / Old Money palette */
        alabaster: "#FAF8F5",
        charcoal: "#1A1C19",
        bordeaux: "#4A1C27",
        champagne: "#C2A878",
      },
      boxShadow: {
        /* Removed soft/glow shadows. Luxury is flat. */
      },
      backdropBlur: {
        glass: "12px",
        "glass-lg": "20px",
      },
      borderRadius: {
        /* Strictly no rounded corners */
        "btn": "0px",
        "input": "0px",
        "card": "0px",
      },
    },
  },
  plugins: [],
};

export default config;
