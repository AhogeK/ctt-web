# Plan: Device Management Page

Date: 2026-04-28
Status: in-progress

## Objective

Add a device management page where users can see all their registered devices and revoke specific ones. Each device shows name, last active time, and platform.

## Backend Contract (ctt-server)

The `devices` table exists in DB but has no JPA entity, repository, controller, or DTO.

### Endpoints to Create

1. `GET /api/v1/devices` — List user's devices (returns `List<DeviceResponse>`)
2. `DELETE /api/v1/devices/{deviceId}` — Revoke a specific device (revokes all refresh tokens for that device)

## Implementation Steps

### Phase 1: Backend (ctt-server)

1. Create Device entity
2. Create DeviceRepository
3. Create DeviceResponse DTO
4. Create DeviceService
5. Create DeviceController

### Phase 2: Frontend (ctt-web)

6. Create Zod schemas for device data
7. Create API layer functions
8. Add route and route name
9. Create DevicesView component
10. Update sidebar navigation

### Phase 3: Verification

11. Build and type-check frontend
