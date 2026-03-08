import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const repoName = env.VITE_GH_PAGES_REPO || "GovDataCodexVSCode";

  return {
    plugins: [react()],
    base: mode === "production" ? `/${repoName}/` : "/",
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true
        },
        "/health": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true
        }
      }
    }
  };
});