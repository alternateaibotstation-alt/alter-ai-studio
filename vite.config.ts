import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // The app is served from the site root. Pinning base to "/" guarantees that
  // built asset URLs (/assets/*.js, /assets/*.css) and client-side routes
  // resolve correctly in production.
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@apps": path.resolve(__dirname, "./apps"),
      "@modules": path.resolve(__dirname, "./modules"),
      "@server": path.resolve(__dirname, "./server"),
      "@shared": path.resolve(__dirname, "./lib"),
    },
  },
  build: {
    // Surface the resolved base in build output so deployment mismatches
    // (e.g. assets requested from a sub-path that doesn't exist) are easy
    // to spot in CI logs.
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query",
            "framer-motion",
          ],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-dropdown-menu",
          ],
        },
      },
    },
  },
}));
