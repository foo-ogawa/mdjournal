import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.generated.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'src/test/**'],
    },
  },
  resolve: {
    alias: {
      '@mdjournal/contract': path.resolve(__dirname, '../packages/contract/mdjournal'),
    },
  },
});

