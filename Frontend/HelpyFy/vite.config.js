import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Enable code splitting
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-hot-toast'],
          // Feature chunks
          'admin-pages': [
            './src/pages/AdminTickets.jsx',
            './src/pages/AdminEmployeeMaster.jsx',
            './src/pages/AdminAsset.jsx',
            './src/pages/AdminSoftwareDashboard.jsx',
            './src/pages/AssetStoreFiori.jsx',
          ],
          'user-pages': [
            './src/pages/Dashboard.jsx',
            './src/pages/CreateTicket.jsx',
            './src/pages/MyTickets.jsx',
          ],
          'asset-pages': [
            './src/pages/AssetHistory.jsx',
            './src/pages/AssetUpload.jsx',
          ],
          'auth-pages': [
            './src/pages/Login.jsx',
            './src/pages/Register.jsx',
          ],
        },
      },
    },
    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
});