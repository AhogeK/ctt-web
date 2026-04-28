# Approach: Leaderboard Error Handling Fix

## Problem

The leaderboard page shows "Please try again later" for all errors, even when specific error codes like `LEADERBOARD_NOT_AVAILABLE` and `USER_NOT_IN_LEADERBOARD` are returned by the backend.

## Root Cause Analysis

### Phase 1: Contract Discovery

1. **Backend ErrorCode.java** had no leaderboard error codes — only COMMON, AUTH, USER, MAIL, RATE_LIMIT, SECURITY, SYSTEM groups existed.
2. **RestApiResponseSchema** in `api.schema.ts` was missing the `code` field — the backend returns `{ success, message, data, timestamp, code? }` but the schema only validated `{ success, message, data, timestamp }`.
3. **mapApiErrorCode** in `api-error.ts` had no leaderboard error code mappings.
4. **No leaderboard API layer** existed — no `lib/api/leaderboard.ts` or `lib/schemas/leaderboard.schema.ts`.

### Error Response Format (verified from ctt-server)

```json
{
  "code": "LEADERBOARD_001",
  "message": "Leaderboard is not available",
  "httpStatus": 503,
  "details": [],
  "traceId": "...",
  "timestamp": "2026-04-28T..."
}
```

### ofetch Error Shape

When ofetch throws on non-2xx responses:

```typescript
error.data.code // ← Error code is HERE
error.data.message // ← Message is HERE
```

## Solution

### 1. Backend: Added Leaderboard Error Codes

**File**: `ctt-server/src/main/java/com/ahogek/cttserver/common/exception/ErrorCode.java`

```java
LEADERBOARD_001("Leaderboard is not available", HttpStatus.SERVICE_UNAVAILABLE),
LEADERBOARD_002("User not found in leaderboard", HttpStatus.NOT_FOUND),
```

### 2. Frontend Schema: Added `code` Field to RestApiResponseSchema

**File**: `src/lib/schemas/api.schema.ts`

```typescript
code: z.string().optional(),  // Error code for failed operations
```

This enables proper parsing of error responses that include the `code` field.

### 3. Frontend Error Mapping: Added Leaderboard Codes

**File**: `src/lib/utils/api-error.ts`

```typescript
LEADERBOARD_001: 'The leaderboard is currently unavailable. Please try again later.',
LEADERBOARD_002: 'You are not ranked on the leaderboard yet. Start tracking your coding time to appear.',
```

### 4. Frontend API Layer: Created Leaderboard Module

**File**: `src/lib/api/leaderboard.ts`

- `getGlobalLeaderboard(params)` — GET /api/v1/leaderboard/global
- `getUserLeaderboardPosition()` — GET /api/v1/leaderboard/me
- `getTeamLeaderboard(teamId, params)` — GET /api/v1/leaderboard/team/{teamId}

All functions use two-step parsing: `RestApiResponseSchema` → inner data schema.

### 5. Frontend Schemas: Created Leaderboard Schemas

**File**: `src/lib/schemas/leaderboard.schema.ts`

- `LeaderboardEntrySchema` — single entry (userId, displayName, rank, totalMinutes)
- `GlobalLeaderboardSchema` — list response (entries, totalUsers, updatedAt)
- `UserLeaderboardPositionSchema` — user position (rank, totalMinutes, usersAbove/Below)

### 6. Barrel Exports Updated

- `src/lib/api/index.ts` — exports leaderboard API functions
- `src/lib/utils/index.ts` — exports `mapApiErrorCode`, `getErrorMessage`, `isApiError`

## Verification

- `vp check` — 0 errors in modified/new files (4 pre-existing errors unrelated to this change)
- `vp test` — 288/296 tests pass (8 pre-existing failures from beta.86-beta.87)

## Pre-existing Test Failures (Not Caused by This Change)

1. **auth.test.ts** (4 failures): Mocks return unwrapped data but `login()`/`refresh()` expect `RestApiResponseSchema` wrapper
2. **instance.test.ts** (4 failures): Tests expect toast calls removed in beta.86 interceptor cleanup

## Files Modified

| File                            | Change                                      |
| ------------------------------- | ------------------------------------------- |
| `ctt-server/.../ErrorCode.java` | Added LEADERBOARD_001, LEADERBOARD_002      |
| `src/lib/schemas/api.schema.ts` | Added `code` field to RestApiResponseSchema |
| `src/lib/utils/api-error.ts`    | Added leaderboard error code mappings       |
| `src/lib/api/index.ts`          | Added leaderboard exports                   |
| `src/lib/utils/index.ts`        | Added api-error exports                     |

## Files Created

| File                                    | Purpose                                 |
| --------------------------------------- | --------------------------------------- |
| `src/lib/schemas/leaderboard.schema.ts` | Zod schemas for leaderboard data        |
| `src/lib/api/leaderboard.ts`            | API functions for leaderboard endpoints |
