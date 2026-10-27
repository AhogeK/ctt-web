import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4173',
    /* Desktop 1080p viewport: the app sidebar overlays content at narrower
     * widths in headless hit-testing, which breaks clicks on content rows. */
    viewport: { width: 1920, height: 1080 },

    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    /*
     * Headless everywhere, local runs included.
     *
     * This used to be `!!process.env.CI`, i.e. **headed locally** — and a headed run takes the
     * machine over: every spec opens a visible browser that steals focus, so the computer is
     * unusable until the suite finishes. Watching a run is a debugging need, not the normal
     * path, and Playwright already ships the switch for it:
     *
     *     pnpm test:e2e --headed            # one spec, watched
     *
     * Kept explicit rather than deleted, so the default does not get quietly reversed again.
     */
    headless: true,
  },

  /*
   * Chromium only, deliberately.
   *
   * The scaffold shipped chromium/firefox/webkit, but `pnpm test:e2e` could never pass
   * anywhere: `playwright install` is invoked for chromium alone (see
   * `.github/workflows/ci.yml`), so the other two projects failed at launch for an
   * uninstalled engine — and no assertion had ever been written or fixed against them.
   * A project that is never run is not coverage, it is a failing step.
   *
   * Chromium is the engine the suite is written against and the one CI installs. If
   * cross-engine verification is ever wanted, install that engine AND run its suite
   * before enabling it here — an uninstalled project silently takes the whole run down.
   */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /*
   * Run the local preview server before starting the tests.
   *
   * The preview server serves the production build, on every machine, in CI and locally. The dev
   * server was the local default for a faster feedback loop, but it translates modules on demand,
   * so every spec in the suite queued behind the same bottleneck: a full local run took 153s and
   * one heavy spec ran out of time under that load, while the same suite against the preview
   * build takes 54s and passes outright. It also spares the developer's own dev server the load
   * of the whole suite.
   *
   * The build lives in the `test:e2e` script rather than in this command, so it happens whether
   * or not this server is started here: a preview server that is already running is reused, and
   * it serves the build the script has just produced. A command that built would be skipped along
   * with the server, and the suite would then run against a stale build without saying so.
   */
  webServer: {
    command: 'pnpm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
