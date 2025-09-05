// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // tokens; adjust in globals.css
          bg: "hsl(var(--brand-bg))",
          surface: "hsl(var(--brand-surface))",
          primary: "hsl(var(--brand-primary))",
          primaryFg: "hsl(var(--brand-primary-fg))",
          text: "hsl(var(--brand-text))",
          subtext: "hsl(var(--brand-subtext))",
          border: "hsl(var(--brand-border))",
          accent: "hsl(var(--brand-accent))",
          success: "hsl(var(--brand-success))",
          warn: "hsl(var(--brand-warn))",
          danger: "hsl(var(--brand-danger))",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 14px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
