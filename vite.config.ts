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
        "/api/translate": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          timeout: 60000, // 60 second timeout for translations
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, res) => {
              console.error("Translation Proxy error:", err);
              if (res && !res.headersSent) {
                res.writeHead(503, {
                  "Content-Type": "application/json",
                });
                res.end(
                  JSON.stringify({
                    error: "Backend server is not running",
                    message:
                      "Please start the backend server with: npm run server",
                  }),
                );
              }
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("Proxying translation request:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "Translation response status:",
                proxyRes.statusCode,
                "for",
                req.url,
              );
            });
          },
        },
      },
    },
  };
});
