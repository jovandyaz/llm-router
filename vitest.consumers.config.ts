import { defineConfig } from 'vitest/config';

// Runs against the built `dist`, so `pnpm build` must come first.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
