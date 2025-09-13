/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "tunnel-glow": "tunnel-glow 4s ease-in-out infinite",
        "light-sweep": "light-sweep 6s ease-in-out infinite",
        "champions-pulse": "champions-pulse 8s ease-in-out infinite",
      },
      keyframes: {
        "tunnel-glow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        "light-sweep": {
          "0%": { transform: "translateX(-100%) skewX(-15deg)", opacity: "0" },
          "50%": { opacity: "0.7" },
          "100%": { transform: "translateX(200%) skewX(-15deg)", opacity: "0" },
        },
        "champions-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
      },
      backgroundImage: {
        "tunnel-gradient":
          "radial-gradient(ellipse at center, rgba(31, 41, 55, 0.8) 0%, rgba(0, 0, 0, 0.95) 70%)",
        "champions-tunnel":
          "radial-gradient(ellipse at bottom center, rgba(21, 35, 91, 0.9) 0%, rgba(12, 20, 55, 0.95) 50%, rgba(5, 10, 25, 1) 100%)",
        "kick-of-light":
          "radial-gradient(ellipse at center, rgba(21, 35, 91, 0.95) 0%, rgba(12, 20, 55, 0.98) 40%, rgba(5, 10, 25, 1) 80%)",
        "prism-rainbow":
          "conic-gradient(from 45deg at 50% 50%, rgba(255, 0, 127, 0.3) 0deg, rgba(0, 255, 255, 0.3) 60deg, rgba(127, 255, 0, 0.3) 120deg, rgba(255, 127, 0, 0.3) 180deg, rgba(127, 0, 255, 0.3) 240deg, rgba(255, 255, 0, 0.3) 300deg, rgba(255, 0, 127, 0.3) 360deg)",
        "glass-starball":
          "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(0, 255, 255, 0.12) 50%, rgba(255, 0, 255, 0.12) 70%, transparent 100%)",
        "stadium-spotlight":
          "radial-gradient(circle at bottom center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 30%, transparent 70%)",
        "tunnel-lines": `conic-gradient(from 0deg at 50% 50%, 
          transparent 0deg, 
          rgba(255,255,255,0.05) 45deg, 
          transparent 90deg, 
          rgba(255,255,255,0.05) 135deg, 
          transparent 180deg,
          rgba(255,255,255,0.05) 225deg, 
          transparent 270deg,
          rgba(255,255,255,0.05) 315deg, 
          transparent 360deg)`,
        "champions-stars": `repeating-conic-gradient(from 0deg at 50% 50%,
          transparent 0deg,
          rgba(51, 239, 255, 0.03) 30deg,
          transparent 60deg,
          rgba(246, 89, 253, 0.03) 90deg,
          transparent 120deg)`,
        "realistic-tunnel": `
          linear-gradient(135deg, 
            rgba(40, 40, 50, 0.95) 0%, 
            rgba(25, 25, 35, 0.98) 25%,
            rgba(15, 15, 20, 1) 50%,
            rgba(25, 25, 35, 0.98) 75%,
            rgba(40, 40, 50, 0.95) 100%),
          repeating-linear-gradient(90deg,
            transparent 0px,
            rgba(200, 200, 200, 0.02) 2px,
            rgba(150, 150, 150, 0.04) 4px,
            transparent 6px,
            transparent 50px)`,
        "tunnel-lighting": `
          radial-gradient(ellipse at 50% 0%, 
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.15) 30%,
            transparent 60%),
          radial-gradient(ellipse at 50% 100%, 
            rgba(100, 200, 255, 0.2) 0%,
            rgba(100, 200, 255, 0.1) 40%,
            transparent 70%)`,
        "tunnel-walls": `
          linear-gradient(to right,
            rgba(60, 60, 70, 0.9) 0%,
            rgba(40, 40, 50, 0.7) 15%,
            transparent 30%,
            transparent 70%,
            rgba(40, 40, 50, 0.7) 85%,
            rgba(60, 60, 70, 0.9) 100%)`,
      },
    },
  },
  plugins: [],
};
