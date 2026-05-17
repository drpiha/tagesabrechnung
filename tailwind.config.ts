import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f5f7ff",
          100: "#e6eaff",
          500: "#4f57ff",
          600: "#3f47e5",
          700: "#2f37c5",
          900: "#1a1f7a"
        }
      }
    }
  },
  plugins: []
};
export default config;
