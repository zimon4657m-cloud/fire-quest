import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/fire-quest/',
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
