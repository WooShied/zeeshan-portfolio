import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the build portable (any host, any sub-path).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
