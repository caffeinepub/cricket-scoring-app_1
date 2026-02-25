/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Override with CSS variable approach
        navy: {
          DEFAULT: "var(--navy)",
          dark: "var(--navy-dark)",
          light: "var(--navy-light)",
        },
        orange: {
          DEFAULT: "var(--orange)",
          light: "var(--orange-light)",
          dark: "var(--orange-dark)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#e8eef7",
          100: "#c5d4e8",
          200: "#9fb8d8",
          300: "#789bc8",
          400: "#5a85bc",
          500: "#3c6fb0",
          600: "#2d5a96",
          700: "#1e3a5f",
          800: "#152a47",
          900: "#0f1f3d",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#fff3ec",
          100: "#ffe4cc",
          200: "#ffc99a",
          300: "#ffa868",
          400: "#ff8c61",
          500: "#ff6b35",
          600: "#e85520",
          700: "#c44010",
          800: "#9e3008",
          900: "#7a2205",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Score/stat colors
        score: {
          runs: "#ff6b35",
          wickets: "#e85520",
          rate: "#ffa868",
          dot: "#1e3a5f",
          boundary: "#ff8c61",
          six: "#c44010",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        'navy-sm': '0 2px 4px oklch(0.22 0.07 240 / 0.15)',
        'navy-md': '0 4px 12px oklch(0.22 0.07 240 / 0.2)',
        'navy-lg': '0 8px 24px oklch(0.22 0.07 240 / 0.25)',
        'orange-glow': '0 0 12px oklch(0.65 0.18 45 / 0.4)',
        'card': '0 2px 8px oklch(0.22 0.07 240 / 0.12)',
        'card-hover': '0 6px 20px oklch(0.22 0.07 240 / 0.18)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-orange": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-in": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-orange": "pulse-orange 2s ease-in-out infinite",
        "slide-in": "slide-in 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
}
