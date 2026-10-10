import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        app: "#F5F7F5",
        surface: "#FFFFFF",
        ink: "#17211D",
        subtle: "#66736C",
        brand: {
          DEFAULT: "#176B52",
          deep: "#104B3B",
          tint: "#E8F4EE",
          lime: "#D6F36A",
        },
        line: "#E1E7E2",
        warn: { DEFAULT: "#A85D10", surface: "#FBF3E6" },
        critical: { DEFAULT: "#B42318", surface: "#FDECEA" },
        success: { DEFAULT: "#18794E", surface: "#E7F5EE" },
        info: { DEFAULT: "#315E8A", surface: "#EAF1F8" },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      maxWidth: {
        container: "1200px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 33, 29, 0.04), 0 1px 3px rgba(23, 33, 29, 0.06)",
        raised: "0 4px 12px rgba(23, 33, 29, 0.08)",
        float: "0 18px 40px -18px rgba(16, 75, 59, 0.35), 0 6px 14px -8px rgba(23, 33, 29, 0.18)",
        scene: "0 40px 90px -40px rgba(16, 75, 59, 0.55)",
      },
      transitionDuration: {
        fast: "140ms",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-40%)", opacity: "0" },
          "18%": { opacity: "0.85" },
          "50%": { opacity: "0.85" },
          "82%": { opacity: "0" },
          "100%": { transform: "translateY(140%)", opacity: "0" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        dash: {
          to: { strokeDashoffset: "-24" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        scan: "scan 6.5s ease-in-out infinite",
        floaty: "floaty 6.5s ease-in-out infinite",
        "floaty-slow": "floaty 8.5s ease-in-out infinite",
        dash: "dash 1.4s linear infinite",
        "pulse-soft": "pulseSoft 3.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
