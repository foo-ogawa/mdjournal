import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.generated.ts', 'src/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@mdjournal/contract': '../packages/contract/mdjournal',
    },
  },
});

