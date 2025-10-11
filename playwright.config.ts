import { defineConfig } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Unified test runner for:
 * - Fixture-based webhook replay tests (fast)
 * - Live blockchain integration tests (slow)
 */
export default defineConfig({
  testDir: './e2e/tests',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential to avoid GitHub API rate limits
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'e2e/artifacts/playwright-report' }],
    ['json', { outputFile: 'e2e/artifacts/results.json' }],
    ['list'] // Console output
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_APP_DEPLOYMENT_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Test output directory */
  outputDir: 'e2e/artifacts/test-results',
  
  /* Global setup/teardown */
  globalSetup: './e2e/helpers/global-setup.ts',
  
  /* Configure projects for different test types */
  projects: [
    {
      name: 'fixture-replay',
      testMatch: '**/fixture-replay.spec.ts',
      timeout: 30000, // 30 seconds - fast fixture tests
      use: {
        // No browser needed for fixture replay
      },
    },
    
    {
      name: 'blockchain-integration',
      testMatch: '**/blockchain-integration.spec.ts',
      timeout: 300000, // 5 minutes - slow blockchain tests
      retries: 2, // Extra retries for network flakiness
      use: {
        // No browser needed for blockchain tests
      },
    },
  ],

  /* Environment variable validation */
  expect: {
    timeout: 10000, // 10 second timeout for assertions
  },
});