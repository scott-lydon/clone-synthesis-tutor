/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Trade Mogging theme: deep navy night bazaar with warm lantern accents.
        // Synthesis-aligned base, gold-amber accent for cash/profit, terracotta for danger.
        'bazaar-night': '#010d29',
        'bazaar-stall': '#152340',
        'bazaar-panel': '#1f2f55',
        'bazaar-edge': '#2c3f6e',
        'lantern-gold': '#f5c542',
        'lantern-deep': '#c98e1c',
        'spice-red': '#d9533a',
        'mint-fresh': '#3ad9a6',
        'sand-warm': '#e8d4a8',
        'text-primary': '#f2efe6',
        'text-muted': '#a8b3cf',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      animation: {
        'wobble': 'wobble 0.5s ease-in-out',
        'mog-flash': 'mogFlash 0.6s ease-out',
        'cash-pop': 'cashPop 0.4s ease-out',
      },
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
        mogFlash: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '40%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cashPop: {
          '0%': { transform: 'translateY(20px) scale(0.8)', opacity: '0' },
          '60%': { transform: 'translateY(-4px) scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
