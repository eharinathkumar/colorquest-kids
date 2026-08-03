import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "android" ? "./" : "/colorquest-kids/",
  plugins: [react()],
  build: {
    // Production source maps reconstruct most of the authored source and are
    // unnecessary in the public Pages build or Play Store bundle.
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css") ? "assets/app.css" : "assets/[name][extname]",
      },
    },
  },
}));
