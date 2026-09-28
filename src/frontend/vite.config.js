import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8086",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://127.0.0.1:8086",
        ws: true,
      },
      // 👇 아래 두 줄(oauth2, login)을 추가해 주세요!
      "/oauth2": {
        target: "http://127.0.0.1:8086",
        changeOrigin: true,
      },
      "/login": {
        target: "http://127.0.0.1:8086",
        changeOrigin: true,
      },
    },
  },
});
