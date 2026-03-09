import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    sourcemap: process.env.NODE_ENV === "development" ? "inline" : undefined,
    cssMinify: process.env.NODE_ENV !== "development",
    minify: process.env.NODE_ENV !== "development",
    rollupOptions: {
      input: "index.html",
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
