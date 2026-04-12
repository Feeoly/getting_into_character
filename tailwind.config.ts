import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        card: "var(--radius-card)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        "soft-sm": "var(--shadow-soft-sm)",
      },
    },
  },
} satisfies Config;

