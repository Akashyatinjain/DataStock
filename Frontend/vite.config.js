import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { seoPrerenderPlugin } from "./vite-plugin-seo.js";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seoPrerenderPlugin(),
  ],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@reduxjs/toolkit",
      "react-redux",
      "lucide-react",
    ],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
            if (id.includes("@reduxjs") || id.includes("react-redux")) {
              return "vendor-redux";
            }
            if (id.includes("lucide-react") || id.includes("react-icons")) {
              return "vendor-icons";
            }
            if (id.includes("pdfjs-dist")) {
              return "vendor-pdf";
            }
            if (id.includes("xlsx")) {
              return "vendor-xlsx";
            }
            if (id.includes("mammoth")) {
              return "vendor-mammoth";
            }
            if (id.includes("jszip")) {
              return "vendor-jszip";
            }
            if (id.includes("axios") || id.includes("socket.io-client")) {
              return "vendor-network";
            }
          }
        },
      },
    },
  },
});