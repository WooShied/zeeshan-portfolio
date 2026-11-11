import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the build portable (any host, any sub-path).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // three.js is a deferred chunk (loaded after first paint), so its size is expected.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes("node_modules/three") ? "three" : undefined),
      },
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
});
