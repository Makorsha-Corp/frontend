import path from "path"
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    host: '127.0.0.1',
    // Allow Cloudflare quick tunnel hosts for remote UX review
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Unit tests only — Playwright specs in e2e/ run via `npm run test:e2e`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
