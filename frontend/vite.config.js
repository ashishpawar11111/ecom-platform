import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/products": "http://api:3000",
      "/orders": "http://api:3000",
      "/healthz": "http://api:3000"
    }
  }
});
