import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@structpaper/doc-model': path.resolve(__dirname, 'packages/doc-model/src'),
      '@structpaper/journal-profiles': path.resolve(__dirname, 'packages/journal-profiles/src'),
      '@structpaper/editor-core': path.resolve(__dirname, 'packages/editor-core/src'),
      '@structpaper/storage': path.resolve(__dirname, 'packages/storage/src'),
      '@structpaper/ingest-docx': path.resolve(__dirname, 'packages/ingest-docx/src'),
      '@structpaper/compiler-client': path.resolve(__dirname, 'packages/compiler-client/src'),
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/*.{test,spec}.{ts,tsx}',
      'apps/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
      'contracts/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**',
      '**/*.e2e.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
