import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      proxy: {
        "/api/tts": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
        "/api/translate": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
