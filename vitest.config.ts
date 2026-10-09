import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/.agents/**', '**/dist/**'],
    include: ['packages/**/*.{test,spec}.{ts,js}', 'tests/**/*.{test,spec}.{ts,js}'],
  },
});
