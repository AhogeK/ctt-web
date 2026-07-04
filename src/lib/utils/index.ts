import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { getOrCreateDeviceId } from './device'
export { mapApiErrorCode, getErrorMessage, isApiError } from './api-error'
export type { ApiError, ApiErrorResponse } from './api-error'
export { encodeBase64, decodeBase64 } from './codec'
export { getCsrfToken, injectCsrfHeader } from './csrf'
