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
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 33, 29, 0.04), 0 1px 3px rgba(23, 33, 29, 0.06)",
        raised: "0 4px 12px rgba(23, 33, 29, 0.08)",
      },
      transitionDuration: {
        fast: "140ms",
      },
    },
  },
  plugins: [],
};

export default config;
