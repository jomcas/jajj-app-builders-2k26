import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  // MapLibre is most of the bundle; the portal runs locally, so one chunk is fine.
  build: { chunkSizeWarningLimit: 2000 },
  test: { include: ['test/**/*.test.ts'] },
});
