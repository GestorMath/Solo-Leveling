import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Share Tech Mono', 'Courier New', 'monospace'],
      },
      colors: {
        'game-cyan': '#00ffff',
        'game-purple': '#9944ff',
        'game-gold': '#ffdd00',
      },
      animation: {
        'arise': 'ariseAnim 0.8s ease-in-out infinite alternate',
        'chain-shake': 'chainShake 0.5s ease-in-out infinite',
      },
      keyframes: {
        ariseAnim: {
          '0%': { textShadow: '0 0 20px rgba(0,255,255,0.5)' },
          '100%': { textShadow: '0 0 60px rgba(0,255,255,1), 0 0 100px rgba(147,51,234,0.8)' },
        },
        chainShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;