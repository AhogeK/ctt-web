import { setupWorker, type SetupWorkerApi } from 'msw/browser'
import { authHandlers } from './handlers/auth.js'

/**
 * MSW service-worker setup for Playwright E2E tests.
 *
 * Registers the combined handler set (auth + future handlers) with a
 * single `setupWorker` call. The returned `SetupWorkerApi` is created
 * lazily on first access so the module can be imported from a Node
 * process (e.g. Playwright's `globalSetup` or the test runner that
 * loads the spec file) without crashing — `setupWorker()` requires a
 * real browser context because it accesses `navigator.serviceWorker`.
 *
 * Tests should call `await worker.start()` inside a `beforeAll` hook to
 * install the Service Worker that intercepts outbound `fetch`/`XHR`
 * requests originating from the page. The `worker` is exposed as a
 * `Proxy` so `start()`, `stop()`, `use()`, `resetHandlers()` etc. all
 * delegate to the lazily-constructed instance.
 */
let _worker: SetupWorkerApi | undefined

function getWorker(): SetupWorkerApi {
  if (!_worker) {
    _worker = setupWorker(...authHandlers)
  }
  return _worker
}

/**
 * Re-export of the started worker. Consumers typically do:
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
 */
export const worker: SetupWorkerApi = new Proxy({} as SetupWorkerApi, {
  get(_target, prop) {
    const w = getWorker()
    const value = w[prop as keyof SetupWorkerApi]
    return typeof value === 'function' ? value.bind(w) : value
  },
})
