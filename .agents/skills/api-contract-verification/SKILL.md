---
name: api-contract-verification
description: MANDATORY workflow for ANY API integration between ctt-web frontend and ctt-server backend. Use this skill whenever the user mentions API integration, connecting to backend, calling endpoints, implementing API calls, fetching data from server, or any work involving ofetch/Zod schemas for backend communication. Even if the user just says "add a feature" that involves backend data, this skill applies.
---

# API Contract Verification

This skill prevents bugs caused by assuming API contracts instead of verifying them. The frontend (ctt-web, Vue 3 + TypeScript + ofetch + Zod) connects to a Spring Boot backend (ctt-server). Historical bugs include:

- Double toast popups (global interceptor + component both firing)
- Login success treated as error (parsed raw response instead of wrapper)
- Wrong error code field (`error.error` instead of `error.data.code`)

**The root cause**: Assuming response shape without reading actual backend code.

---

## Backend Reference

| Resource                | Location                                               |
| ----------------------- | ------------------------------------------------------ |
| Swagger UI              | http://localhost:8080/ctt-server/swagger-ui/index.html |
| Backend source          | `../ctt-server` (relative to ctt-web root)             |
| Mailpit (email testing) | http://localhost:8025/                                 |

---

## Response Format (ALWAYS)

All backend endpoints return this wrapper:

```typescript
{
  success: boolean,
  message: string,
  data: T,           // The actual payload is ALWAYS here
  timestamp: string,
  code?: string      // Present on error responses
}
```

**Critical insight**: The actual data you want is inside `data`. Never parse the raw response directly with your inner data schema.

---

## Error Format

Backend returns errors in the response body. When ofetch throws, the error object has:

```typescript
error.data.code // ← Extract error code from HERE
error.data.message // ← Extract message from HERE
```

**NOT** `error.error` — that's undefined.

---

## Phase 1: Contract Discovery (MANDATORY)

Before writing any code, you must understand the actual contract.

### Step 1.1: Read Swagger UI

1. Navigate to http://localhost:8080/ctt-server/swagger-ui/index.html
2. Find the endpoint you're integrating
3. Document:
   - HTTP method (GET/POST/PUT/DELETE)
   - Path (e.g., `/api/auth/login`)
   - Request body schema (if applicable)
   - Response schema (the `data` field's shape)
   - Possible error codes

### Step 1.2: Read Backend Source

Swagger may lag behind code. Always verify by reading:

1. Find the Controller in `../ctt-server/src/main/java/.../controller/`
2. Find the DTO classes in `../ctt-server/src/main/java/.../dto/`
3. Note field names, types, and validation rules

### Step 1.3: Document the Contract

Create a brief contract note (mental or written):

```
Endpoint: POST /api/auth/login
Request: { email: string, password: string }
Response.data: { token: string, user: { id, email, name } }
Error codes: INVALID_CREDENTIALS, USER_NOT_FOUND
```

---

## Phase 2: Schema Definition

Zod schemas must match the actual backend contract.

### Step 2.1: Define Wrapper Schema

Use the existing `RestApiResponseSchema` or define it:

```typescript
const RestApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
    timestamp: z.string(),
    code: z.string().optional(),
  })
```

### Step 2.2: Define Inner Data Schema

Define what's inside `data`:

```typescript
const LoginResponseDataSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
  }),
})
```

### Step 2.3: Compose and Parse in Two Steps

```typescript
// Step 1: Parse wrapper
const wrapped = RestApiResponseSchema(LoginResponseDataSchema).parse(response)

// Step 2: Extract data
const { token, user } = wrapped.data
```

**Why two steps?** If the wrapper shape changes, you get a clear error at the wrapper level, not a confusing error inside your data schema.

---

## Phase 3: Implementation

### Step 3.1: Use lib/api/ Layer

All API calls go through `lib/api/`. Never call ofetch directly in components.

```typescript
// lib/api/auth.ts
export async function login(email: string, password: string) {
  return ofetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}
```

### Step 3.2: Error Handling

Extract error code correctly:

```typescript
try {
  const response = await login(email, password)
  // Handle success
} catch (error: any) {
  const code = error.data?.code // ← NOT error.error
  const message = mapApiErrorCode(code) ?? 'Please try again later'
  // Show message to user
}
```

### Step 3.3: Error Message Strategy

| Code source                     | Message                  |
| ------------------------------- | ------------------------ |
| Known code (in mapApiErrorCode) | Use mapped message       |
| Unknown code                    | "Please try again later" |
| No code                         | "Please try again later" |

**Never** expose HTTP method, path, or status code to users.

### Step 3.4: Toast Handling

Decide ONE place for error toasts:

- **Global interceptor**: For truly unexpected errors (network failures, 500s)
- **Component level**: For expected business errors (invalid credentials, validation failures)

**Never both** — this causes double toasts. If the component handles the error, the interceptor should NOT show a toast.

---

## Phase 4: Self-Test (MANDATORY)

You must actually call the endpoint before declaring the integration complete.

### Step 4.1: Start Backend

Ensure ctt-server is running on localhost:8080.

### Step 4.2: Call the Endpoint

Use curl, browser DevTools, or Swagger UI's "Try it out":

```bash
curl -X POST http://localhost:8080/ctt-server/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 4.3: Verify Response Shape

Compare actual response to your Zod schema:

```json
{
  "success": true,
  "message": "Login successful",
  "data": { "token": "...", "user": { ... } },
  "timestamp": "2024-..."
}
```

Does this match `RestApiResponseSchema(LoginResponseDataSchema)`?

### Step 4.4: Test Error Path

Trigger an error (e.g., wrong password):

```bash
curl -X POST http://localhost:8080/ctt-server/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

Verify error format:

```json
{
  "success": false,
  "message": "Invalid credentials",
  "data": null,
  "timestamp": "2024-...",
  "code": "INVALID_CREDENTIALS"
}
```

### Step 4.5: Only Then Declare Complete

If both success and error paths match your schemas, the integration is verified.

---

## Anti-Patterns (BLOCK THESE)

| Anti-pattern                                               | Why it's wrong                                      |
| ---------------------------------------------------------- | --------------------------------------------------- |
| Assuming response shape without reading Swagger/controller | Backend may have changed; assumptions cause bugs    |
| Parsing raw response with inner data schema (skip wrapper) | Misses `success` check; treats errors as data       |
| Reading `error.error` instead of `error.data.code`         | `error.error` is undefined; code is in `error.data` |
| Declaring complete without calling endpoint                | Schema may not match reality                        |
| Global interceptor toast + component error handling        | Double toast annoyance                              |

---

## Checklist

Before any API integration, verify:

- [ ] Read Swagger UI for endpoint
- [ ] Read Controller + DTO in `../ctt-server`
- [ ] Document request/response/error codes
- [ ] Define wrapper schema + inner data schema
- [ ] Parse in two steps (wrapper first, then data)
- [ ] Use `lib/api/` layer
- [ ] Extract error from `error.data.code`
- [ ] Use `mapApiErrorCode()` for known codes
- [ ] Decide ONE toast location (global OR component)
- [ ] Call endpoint with curl/Swagger
- [ ] Verify success response matches schema
- [ ] Verify error response matches schema
- [ ] Only then declare integration complete
