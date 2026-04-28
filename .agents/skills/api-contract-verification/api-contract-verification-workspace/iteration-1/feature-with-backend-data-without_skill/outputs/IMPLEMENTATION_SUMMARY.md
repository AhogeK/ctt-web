# Device Management Page - Implementation Summary

## Overview

Added a device management page where users can view all registered devices and revoke specific ones. Each device displays name, last active time, and platform.

## Files Created/Modified

### New Files

1. **`src/lib/schemas/device.schema.ts`** - Zod schemas for device DTO validation
   - `DeviceSchema`: Validates device object from API (id, deviceName, platform, ideName, ideVersion, appVersion, lastIp, createdAt, lastSeenAt, updatedAt)
   - `DeviceListResponseSchema`: Validates list response wrapped in RestApiResponse
   - `DeviceRevokeResponseSchema`: Validates revoke response

2. **`src/lib/api/devices.ts`** - API layer functions
   - `fetchDevices()`: GET /api/v1/devices - fetches all user devices
   - `revokeDevice(deviceId)`: DELETE /api/v1/devices/:id - revokes a device

3. **`src/composables/useDevices.ts`** - TanStack Query composables
   - `useDevices()`: Query hook for fetching devices with 30s staleTime
   - `useRevokeDevice()`: Mutation hook with automatic cache invalidation and toast notifications

4. **`src/router/modules/devices.ts`** - Route module for /devices path
   - Uses AppLayout with auth guard
   - Lazy-loads DeviceListView component

5. **`src/features/devices/views/DeviceListView.vue`** - Main view component
   - Device list with card-style layout
   - Platform icons (Monitor/Laptop/Smartphone/Globe based on platform string)
   - Active/Inactive status badges (active = last seen within 7 days)
   - Relative time formatting (Just now, Xm ago, Xh ago, Xd ago, date)
   - Revoke confirmation dialog using shadcn-vue Dialog
   - Loading skeleton, error state, and empty state handling

### Modified Files

1. **`src/router/route-names.ts`** - Added DEVICES and DEVICES_LIST route name constants
2. **`src/components/app/AppSidebar.vue`** - Added "Devices" navigation link between Dashboard and Settings

## Architecture Decisions

### API Contract

Assumed REST endpoints based on ctt-server database schema:

- `GET /api/v1/devices` → Returns `{ success, message, data: Device[], timestamp }`
- `DELETE /api/v1/devices/:id` → Returns `{ success, message, data, timestamp }`

### State Management

- Server state (devices list) → TanStack Query only
- Mutation invalidates query cache on success
- No Pinia involvement (follows project pattern)

### UI Patterns

- Follows existing project conventions: `<script setup>`, Tailwind CSS, shadcn-vue components
- Uses lucide-vue-next for icons
- Toast notifications via vue-sonner for success/error feedback
- Confirmation dialog before destructive action (revoke)

### Device Status Logic

- Active: lastSeenAt within 7 days
- Inactive: lastSeenAt older than 7 days
- Display name priority: deviceName > ideName + ideVersion > "Unknown Device"

## Backend Dependencies

The device table exists in ctt-server (V20260303210000\_\_init_base_schema.sql) with columns:

- id, user_id, device_name, platform, ide_name, ide_version, app_version, last_ip, created_at, last_seen_at, updated_at

However, no DeviceController exists yet in ctt-server. The frontend assumes standard REST endpoints that need to be implemented on the backend.

## Lint/Type Check Status

- TypeScript: Passes (vue-tsc --noEmit)
- Lint: 2 pre-existing errors in auth.ts (ForgotPasswordRequest unused import), no new errors introduced
