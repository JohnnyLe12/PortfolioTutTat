import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Run in Node environment (no DOM needed for API tests)
    environment: 'node',

    // Enable global test APIs (describe, it, expect, beforeEach, etc.)
    globals: true,

    // Load test setup file before each test file
    setupFiles: ['./tests/setup.ts'],

    // Load .env.test automatically — overrides any .env values
    envFile: '.env.test',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/**',          // Vite frontend — not covered by backend tests
        '.next/**',
        'tests/**',
        '**/*.config.*',
        '**/index.ts',
      ],
    },

    // Minimum 100 iterations for fast-check property tests
    // (configured per-test via fc.assert options, but set a sensible timeout)
    testTimeout: 300000,

    // Allow hooks (beforeEach/afterEach) enough time for DB cleanup between tests
    hookTimeout: 60000,

    // Run test files sequentially since all share a single test database.
    // This prevents deadlocks from concurrent TRUNCATE/DELETE operations.
    fileParallelism: false,
  },

  resolve: {
    alias: {
      // Match the @/ path alias defined in tsconfig.json
      '@': path.resolve(__dirname, '.'),
    },
  },
})
