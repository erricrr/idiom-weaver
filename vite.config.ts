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
      host: true, // Allow connections from network
      port: 5173,
      proxy: {
        "/api/tts": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          timeout: 30000, // 30 second timeout
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.error("TTS Proxy error:", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("Proxying TTS request:", req.method, req.url);
            });
          },
        },
      },
    },
  };
});
