import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#080910",
          soft: "#0e111a",
          card: "#13161f",
          hover: "#1a1e2c",
          inset: "#0b0d14",
        },
        border: {
          DEFAULT: "#1e2330",
          soft: "#161a24",
          strong: "#272e42",
        },
        accent: {
          DEFAULT: "#7c5cff",
          hover: "#6a48ff",
          glow: "#a090ff",
          soft: "rgba(124, 92, 255, 0.10)",
        },
        text: {
          DEFAULT: "#eaecf4",
          muted: "#8890a8",
          dim: "#525a70",
          faint: "#343a4e",
        },
        danger: {
          DEFAULT: "#ef4444",
          soft: "rgba(239, 68, 68, 0.10)",
        },
        success: {
          DEFAULT: "#22c55e",
          soft: "rgba(34, 197, 94, 0.10)",
        },
        warn: {
          DEFAULT: "#f59e0b",
          soft: "rgba(245, 158, 11, 0.10)",
        },
      },
      fontFamily: {
        sans: [
          "Outfit",
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.20)",
        lift: "0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.25)",
        glow: "0 0 0 1px rgba(124, 92, 255, 0.50), 0 8px 28px rgba(124, 92, 255, 0.30)",
        "glow-soft": "0 0 0 1px rgba(124, 92, 255, 0.22), 0 4px 14px rgba(124, 92, 255, 0.14)",
        "ring-focus": "0 0 0 3px rgba(124, 92, 255, 0.32)",
        "card": "0 0 0 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.30)",
      },
      animation: {
        "fade-in": "fadeIn 180ms ease-out",
        "slide-up": "slideUp 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-down": "slideDown 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        pop: "pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "bounce-in": "bounceIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)" },
          "60%": { transform: "scale(1.10)" },
          "100%": { transform: "scale(1)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
