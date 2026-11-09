/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        fiori: ['var(--font-jakarta)', 'var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        border: 'var(--border)',
        input: 'var(--border-md)',
        ring: 'var(--primary)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: 'var(--bg-3)',
          foreground: 'var(--text-soft)'
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: '#ffffff'
        },
        muted: {
          DEFAULT: 'var(--bg-2)',
          foreground: 'var(--text-muted)'
        },
        accent: {
          DEFAULT: 'var(--primary-dim)',
          foreground: 'var(--primary)'
        },
        popover: {
          DEFAULT: 'var(--bg-3)',
          foreground: 'var(--text)'
        },
        card: {
          DEFAULT: 'var(--bg-2)',
          foreground: 'var(--text)'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius-sm)',
        sm: 'var(--radius-xs)'
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'xs': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      },
      backdropBlur: {
        'xs': '4px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        blob: "blob 7s infinite",
        shimmer: "shimmer 1.5s infinite",
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
