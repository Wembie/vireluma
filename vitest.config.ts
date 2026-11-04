import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/web/src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/domain/src/**/*.ts', 'apps/web/src/i18n/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      // Thresholds apply to business-critical logic, not the UI layer.
      thresholds: {
        'packages/domain/src/**': { lines: 95, branches: 90, functions: 100, statements: 95 },
      },
    },
  },
});
