import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05070a",
          900: "#0a0e14",
          850: "#0f141c",
          800: "#141b26",
          700: "#1e2733",
          600: "#2a3542",
        },
      },
    },
  },
  plugins: [],
};
export default config;
