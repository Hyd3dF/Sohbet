import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0b10",
          soft: "#10131c",
          card: "#161a26",
          hover: "#1d2230",
          inset: "#0d1018",
        },
        border: {
          DEFAULT: "#222838",
          soft: "#1a1f2c",
          strong: "#2c3346",
        },
        accent: {
          DEFAULT: "#7c5cff",
          hover: "#6a48ff",
          glow: "#9b87ff",
          soft: "rgba(124, 92, 255, 0.12)",
        },
        text: {
          DEFAULT: "#e8eaf0",
          muted: "#8b93a7",
          dim: "#5a6175",
          faint: "#3d4256",
        },
        danger: {
          DEFAULT: "#ef4444",
          soft: "rgba(239, 68, 68, 0.12)",
        },
        success: {
          DEFAULT: "#22c55e",
          soft: "rgba(34, 197, 94, 0.12)",
        },
        warn: {
          DEFAULT: "#f59e0b",
          soft: "rgba(245, 158, 11, 0.12)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
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
        soft: "0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.18)",
        lift: "0 10px 28px rgba(0,0,0,0.34), 0 2px 6px rgba(0,0,0,0.22)",
        glow: "0 0 0 1px rgba(124, 92, 255, 0.45), 0 10px 32px rgba(124, 92, 255, 0.28)",
        "glow-soft": "0 0 0 1px rgba(124, 92, 255, 0.25), 0 4px 16px rgba(124, 92, 255, 0.16)",
        "ring-focus": "0 0 0 3px rgba(124, 92, 255, 0.28)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        pop: "pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)" },
          "60%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
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
