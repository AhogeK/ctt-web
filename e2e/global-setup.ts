import { worker } from './mocks/browser.js'

/**
 * Playwright global setup for MSW (Mock Service Worker).
 *
 * Imports the singleton browser `worker` exported from `e2e/mocks/browser.ts`
 * so that `playwright.config.ts` can wire this file as `globalSetup` and
 * future maintainers have a single, canonical place to inspect MSW
 * bootstrap behavior.
 *
 * ## Why this function does NOT call `worker.start()` itself
 *
 * MSW's browser worker is a **Service Worker** that registers through
 * `navigator.serviceWorker`, which only exists inside a real browser
 * context. Playwright's `globalSetup` runs in Node, so a literal
 * `await worker.start({ onUnhandledRequest: 'bypass' })` here would throw
 * `ReferenceError: navigator is not defined`.
 *
 * The actual start call lives in each auth spec's `test.beforeAll`, where a
 * browser page is available:
 *
 * ```ts
 * import { worker } from '../mocks/browser.js'
 *
 * test.beforeAll(async () => {
 *   await worker.start({ onUnhandledRequest: 'bypass' })
 * })
 *
 * test.afterAll(async () => {
 *   await worker.stop()
 * })
 * ```
 *
 * Returning the teardown closure keeps the lifecycle in one place for
 * grep-ability even though the runtime effect is a no-op in Node.
 *
 * ## Required browser-side setup
 *
 * The MSW Service Worker script (`public/mockServiceWorker.js`) is generated
 * by `pnpm exec msw init public/` and **must** be served by the dev server.
 * Without it `worker.start()` resolves but the worker never intercepts any
 * requests — they pass through to the real backend.
 *
 * @see https://mswjs.io/docs/integrations/browser/playwright
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  // Touch the worker to make the intent visible at the call site and to
  // surface accidental renames / circular-import regressions at startup.
  void worker

  return async function teardown(): Promise<void> {
    // No-op: the browser worker was never started in this Node process.
    // Per-spec `test.afterAll` hooks call `worker.stop()` against the
    // browser context that owns it.
  }
}
