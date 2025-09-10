/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "tunnel-glow": "tunnel-glow 4s ease-in-out infinite",
      },
      keyframes: {
        "tunnel-glow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
      },
      backgroundImage: {
        "tunnel-gradient":
          "radial-gradient(ellipse at center, rgba(31, 41, 55, 0.8) 0%, rgba(0, 0, 0, 0.95) 70%)",
        spotlight:
          "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
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
      },
    },
  },
  plugins: [],
};
