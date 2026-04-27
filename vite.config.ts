import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Lovable hosting (preview, *.lovable.app, custom domains) always serves
  // the app from the site root. Pinning base to "/" guarantees that built
  // asset URLs (/assets/*.js, /assets/*.css) and client-side routes resolve
  // correctly in production. Do NOT change this unless deploying under a
  // sub-path (e.g. https://example.com/app/), which Lovable does not do.
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
        // Keep asset paths predictable and root-relative.
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
}));
