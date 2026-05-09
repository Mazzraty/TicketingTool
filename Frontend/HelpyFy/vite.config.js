import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@pages": path.resolve("src/pages"),
      "@components": path.resolve("src/components"),
      "@layouts": path.resolve("src/layouts"),
      "@api": path.resolve("src/api"),
      "@utils": path.resolve("src/utils"),
    },
  },
});