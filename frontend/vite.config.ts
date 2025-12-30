import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "rewrite-medicine-path",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // Strip /medicine prefix from all requests
          if (req.url?.startsWith("/medicine")) {
            req.url = req.url.replace(/^\/medicine/, "") || "/";
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.startsWith("/medicine")) {
            req.url = req.url.replace(/^\/medicine/, "") || "/";
          }
          next();
        });
      },
    },
    react(),
  ],
  server: {
    port: 3000,
    allowedHosts: ["macbook-air-de-gp.tail5d54f7.ts.net"],
    proxy: {
      "/medicine/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/medicine\/api/, "/api"),
      },
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    allowedHosts: ["macbook-air-de-gp.tail5d54f7.ts.net"],
  },
});
