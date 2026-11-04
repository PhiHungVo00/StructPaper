import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
  {
    test: {
      name: 'monorepo',
      include: [
        'packages/**/*.{test,spec}.{ts,tsx}',
        'apps/**/*.{test,spec}.{ts,tsx}',
        'tests/**/*.{test,spec}.{ts,tsx}',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/e2e/**',
        '**/*.e2e.{test,spec}.{ts,tsx}',
      ],
      environment: 'node',
    },
  },
]);
