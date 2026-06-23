import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Copies index.html → 404.html after build so GitHub Pages serves the SPA shell
// for any route (GitHub Pages returns 404.html on unknown paths).
function spaFallbackPlugin(): Plugin {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const index = path.join(dist, "index.html");
      const fallback = path.join(dist, "404.html");
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, fallback);
      }
    },
  };
}

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
  plugins: [react(), spaFallbackPlugin()].filter(Boolean),
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
