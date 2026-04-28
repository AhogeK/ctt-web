# API Error Debugging: Leaderboard Error Handling Fix

## Problem Description

The leaderboard page was showing "Please try again later" for all errors instead of displaying specific error messages for known error codes like `LEADERBOARD_001` (leaderboard unavailable) and `LEADERBOARD_002` (user not in leaderboard).

## Root Cause Analysis

### Issue 1: Missing Leaderboard Feature

The leaderboard API layer (`src/lib/api/leaderboard.ts`) and error code mappings (`src/lib/utils/api-error.ts`) existed, but there was no leaderboard UI component to display the data and errors.

### Issue 2: Error Message Extraction Pattern

Components were displaying `error?.message` directly (the HTTP status text like "Service Unavailable") instead of using the `getErrorMessage()` utility which:

1. Extracts the error code from `error.data.code`
2. Maps it to a user-friendly message via `mapApiErrorCode()`
3. Falls back to `error.data.message` or a generic message

### Backend Error Codes (from ctt-server ErrorCode.java)

| Code              | HTTP Status | Backend Message                 |
| ----------------- | ----------- | ------------------------------- |
| `LEADERBOARD_001` | 503         | "Leaderboard is not available"  |
| `LEADERBOARD_002` | 404         | "User not found in leaderboard" |

### Frontend Error Mappings (from api-error.ts)

| Code              | User-Friendly Message                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- |
| `LEADERBOARD_001` | "The leaderboard is currently unavailable. Please try again later."                     |
| `LEADERBOARD_002` | "You are not ranked on the leaderboard yet. Start tracking your coding time to appear." |

## Solution

### Files Created

1. **`src/features/leaderboard/composables/useLeaderboard.ts`**
   - TanStack Query composables for leaderboard data fetching
   - `useGlobalLeaderboard()` - Fetches global leaderboard entries
   - `useUserLeaderboardPosition()` - Fetches current user's rank
   - `getLeaderboardErrorMessage()` - Wrapper around `getErrorMessage()` for consistent error display

2. **`src/features/leaderboard/views/LeaderboardView.vue`**
   - Leaderboard view component with proper error handling
   - Shows specific error messages based on error codes
   - Loading skeletons, empty states, and retry functionality
   - Uses `getCombinedErrorMessage()` to display the first available error

3. **`src/router/modules/leaderboard.ts`**
   - Route definition for `/leaderboard` path
   - Requires authentication (`requiresAuth: true`)

4. **`src/lib/utils/__tests__/api-error.test.ts`**
   - Comprehensive tests for error handling utilities
   - Verifies LEADERBOARD_001 and LEADERBOARD_002 code mapping
   - Tests fallback behavior for missing codes/messages

### Files Modified

1. **`src/router/route-names.ts`**
   - Added `LEADERBOARD: 'leaderboard'` route name constant

## Error Flow

```
Backend Error Response (503/404)
  ↓
ofetch throws error with response body in error.data
  ↓
Component receives error from TanStack Query
  ↓
getErrorMessage(error) called
  ↓
isApiError(error) → true (has statusCode)
  ↓
Extract error.data.code → "LEADERBOARD_001"
  ↓
mapApiErrorCode("LEADERBOARD_001") → "The leaderboard is currently unavailable..."
  ↓
Display to user
```

## Key Implementation Details

### Error Code Extraction

The `getErrorMessage()` function in `api-error.ts` handles three error categories:

1. **API errors** (ofetch HTTP errors) - extracts `error.data.code` and maps it
2. **Error instances** - uses `error.message`
3. **Unknown errors** - returns generic fallback

### Component Error Display Pattern

```vue
<!-- Correct: Uses getErrorMessage utility -->
<p>{{ getErrorMessage(error) }}</p>

<!-- Incorrect: Shows HTTP status text -->
<p>{{ error?.message }}</p>
```

## Verification

All 14 tests pass:

- `isApiError` type guard (3 tests)
- `mapApiErrorCode` code mapping (4 tests)
- `getErrorMessage` error extraction (7 tests)

## Lessons Learned

1. **Always use `getErrorMessage()`** - Never display `error?.message` directly from ofetch errors
2. **Error codes live in `error.data.code`** - The backend wraps error responses in a standard format
3. **Test error handling** - Verify error code extraction works for all known error codes
4. **Fallback chain matters** - code → data.message → generic fallback ensures users always see something meaningful
