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
  test: {
    // Unit tests only — Playwright specs in e2e/ run via `npm run test:e2e`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});