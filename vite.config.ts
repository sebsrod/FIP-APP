import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The React app lives in ./web. We keep the Vite config at the repo root so a
// bare `vite` / `vite build` (run from the repo root) picks it up, while the
// app source, index.html and public/ all resolve under ./web.
export default defineConfig({
  root: fileURLToPath(new URL('./web', import.meta.url)),
  publicDir: fileURLToPath(new URL('./web/public', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./web/src', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./web/dist', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    // In dev the frontend is served by Vite (HMR) and all /api calls are proxied
    // to the Worker running under `wrangler dev` on :8787, so the session cookie
    // stays same-origin (http://localhost:5173) — no CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
