import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  optimizeDeps: {
    include: ["recharts"],
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },

    rollupOptions: {
      output: {
        entryFileNames: "[name].[hash].js",
        chunkFileNames: "[name].[hash].js",
        assetFileNames: "[name].[hash].[ext]",
      },
    },

    chunkSizeWarningLimit: 1000,
  },
});