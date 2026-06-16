import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // listen on all interfaces so the tool is reachable when hosted
    proxy: { '/api': 'http://localhost:4000' },
    // The service account key lives at the repo root (inside Vite's default
    // fs.allow workspace) — make sure it can never be served via /@fs/.
    fs: { deny: ['**/service-account.json'] },
  },
});
