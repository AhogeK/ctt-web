# Active Context: ctt-web

## Current Status

**Phase**: E2E testing infrastructure enhanced — ready for dashboard implementation
**Version**: 0.5.0-beta.8 (2026-04-08)

- **Playwright E2E Enhancement (2026-04-08)**:
  - Added `video: 'retain-on-failure'` - Records all tests, retains only failures
  - Added `screenshot: 'only-on-failure'` - Captures screenshots on test failures
  - Existing `trace: 'on-first-retry'` - Captures trace on first retry for debugging
  - Enables zero-cost debugging: trace/video/screenshot only generated on failures
  - CI/Local differentiation already present: retries, workers, forbidOnly

- **API layer architecture (2026-04-06)**:
  - **`src/lib/api/instance.ts` refactored**: Added `onResponseError` interceptor with global error handling (401/403/500), CustomEvent decoupling, localStorage token retrieval
  - **`src/stores/auth.ts` updated**: Added localStorage persistence with `STORAGE_KEYS` constants, token restoration on initialization
  - **`src/main.ts` updated**: Added 401 event listener that clears auth state and redirects to login with redirect query param
  - **`.env` created**: Added `VITE_API_BASE_URL` configuration
  - **Architecture pattern**: API 401 → CustomEvent → main.ts listener → authStore.clearAuth() + router redirect
  - All verification passed: type-check (0 errors), lint (0 warnings), format clean

- **Zod Schema Architecture (2026-04-07)**:
  - Created `src/lib/schemas/api.schema.ts` with common API response schemas
  - `ApiErrorSchema` - Standard error response matching instance.ts interceptor
  - `createApiResponseSchema<T>` - Factory for wrapped responses ({ code, message, data })
  - `createPagedResponseSchema<T>` - Factory for paginated responses (items, total, page, pageSize)
  - Enables runtime validation + end-to-end type safety
  - Follows defensive programming pattern
  - TypeScript types derived from Zod schemas via z.infer<>

- **TanStack Query Configuration (2026-04-07)**:
  - Created `src/lib/query.ts` with global QueryClient instance
  - Configured default staleTime: 30s (data considered fresh)
  - Configured gcTime: 5min (inactive data garbage collection)
  - Disabled refetchOnWindowFocus (prevent API flooding)
  - Set retry: 1 (Fail-Fast behavior)
  - Enabled refetchOnMount and refetchOnReconnect
  - Registered VueQueryPlugin in main.ts
  - Enables Server State vs Client State separation

- **Pinia Store Initialization (2026-04-07)**:
  - Created `src/stores/theme.ts` for theme management (dark/light/auto)
  - Refactored `src/stores/auth.ts` with VueUse `useStorage` for automatic persistence
  - Auth Store: JWT token + userId persistence with expiry tracking
  - Theme Store: Dark mode with system preference detection
  - Uses VueUse utilities: `useStorage`, `useDark` for cross-tab synchronization
  - isAuthenticated computed property for reactive auth state

- **Token Refresh Implementation (2026-04-07)**:
  - Added `refresh()` API function in `src/lib/api/auth.ts`
  - Added `refreshAccessToken()` in `src/stores/auth.ts` with Promise deduping
  - Solves Thundering Herd problem: concurrent 401s → single refresh request
  - Promise lock pattern: `activeRefreshPromise` module-scoped variable
  - All concurrent callers share same promise, preventing refresh storm
  - Fail-fast security: clear auth state on any refresh failure
  - Fallback logic: keeps existing refresh token if response lacks new one
  - Comprehensive test coverage: 7 test cases covering all edge cases

- **Test Infrastructure Setup (2026-04-07)**:
  - Configured Vitest + @testing-library/vue + jest-dom
  - Created src/test/setup.ts with auto-cleanup and browser API mocks
  - Updated vitest.config.ts with globals: true and setupFiles
  - Mocked matchMedia and ResizeObserver for Radix UI / Shadcn support
  - Added proper type parameters to all vi.fn() calls

- **Test Fix: localStorage Key Mismatch (2026-04-07)**:
  - Fixed src/lib/api/__tests__/instance.test.ts to use 'ctt_access_token'
  - Aligned test expectations with STORAGE_KEYS.ACCESS_TOKEN
  - All 19 instance tests now passing (100% pass rate)
