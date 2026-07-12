import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 서버: /api 요청을 FastAPI 백엔드(:8000)로 프록시한다.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
