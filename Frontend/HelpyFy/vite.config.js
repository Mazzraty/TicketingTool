import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Enable code splitting with dynamic imports
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router-vendor';
          }
          if (id.includes('node_modules/react-hot-toast')) {
            return 'ui-vendor';
          }
          
          // Feature chunks - Admin pages
          if (id.includes('/pages/AdminTickets') || 
              id.includes('/pages/AdminEmployeeMaster') || 
              id.includes('/pages/AdminAsset') ||
              id.includes('/pages/AdminSoftwareDashboard') ||
              id.includes('/pages/AssetStoreFiori')) {
            return 'admin-pages';
          }
          
          // Feature chunks - User pages
          if (id.includes('/pages/Dashboard') || 
              id.includes('/pages/CreateTicket') || 
              id.includes('/pages/MyTickets')) {
            return 'user-pages';
          }
          
          // Feature chunks - Asset pages
          if (id.includes('/pages/AssetHistory') || 
              id.includes('/pages/AssetUpload')) {
            return 'asset-pages';
          }
          
          // Feature chunks - Auth pages
          if (id.includes('/pages/Login') || 
              id.includes('/pages/Register')) {
            return 'auth-pages';
          }
        },
      },
    },
    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
});