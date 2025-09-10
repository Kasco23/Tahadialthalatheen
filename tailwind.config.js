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
          "radial-gradient(ellipse at bottom center, rgba(10, 27, 81, 0.9) 0%, rgba(5, 15, 40, 0.95) 50%, rgba(0, 0, 0, 1) 100%)",
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
      },
    },
  },
  plugins: [],
};
