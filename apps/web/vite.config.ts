import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // @solana/web3.js usa Buffer — apontamos pro polyfill no browser
      buffer: "buffer",
    },
  },
  define: {
    global: "globalThis",
  },
  server: {
    port: 5173,
  },
});
