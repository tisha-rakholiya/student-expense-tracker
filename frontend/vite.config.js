import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development:
//   /api       -> Express backend (Node.js) on port 5000
//   /analytics -> FastAPI service (Python) on port 8000
// and the app opens in the browser automatically
export default defineConfig({
  plugins: [react()],
  server: {
    open: "http://localhost:5173",
    proxy: {
      "/api": "http://localhost:5000",
      "/analytics": "http://localhost:8000",
    },
  },
});
