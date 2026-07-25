import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset URLs work for both project Pages sites and custom domains.
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    css: true,
  },
});
