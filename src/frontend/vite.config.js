import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
  },
  server: {
    port: 8087,
    proxy: {
      "/api": {
        target: "http://localhost:8086",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:8086",
        ws: true,
      },
      // 👇 아래 두 줄(oauth2, login)을 추가해 주세요!
      "/oauth2": {
        target: "http://localhost:8086",
        changeOrigin: true,
      },
      "/login": {
        target: "http://localhost:8086",
        changeOrigin: true,
      },
    },
  },
});
