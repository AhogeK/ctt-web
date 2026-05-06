import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { getPublicConfig, type PublicConfig } from '@/lib/api/config'

/**
 * Public configuration store for managing app-wide public settings.
 *
 * Responsibilities:
 * - Fetch public config once on first access (lazy initialization)
 * - Cache data in store state to prevent duplicate API requests
 * - Provide termsVersion to all consumers
 *
 * This store acts as single source of truth for public config,
 * eliminating duplicate requests from multiple components.
 */
export const usePublicConfigStore = defineStore('publicConfig', () => {
  const publicConfig = ref<PublicConfig | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const termsVersion = computed(() => publicConfig.value?.termsVersion ?? '')

  /**
   * Fetches public config from API and caches in store.
   * Only fetches once - subsequent calls return cached data.
   *
   * @returns Promise resolving to PublicConfig data
   * @throws Error if API request fails
   */
  async function fetchPublicConfig(): Promise<PublicConfig> {
    if (publicConfig.value) {
      return publicConfig.value
    }

    if (isLoading.value) {
      await new Promise((resolve) => {
        const unwatch = watch(isLoading, (val: boolean) => {
          if (!val) {
            unwatch()
            resolve(undefined)
          }
        })
      })
      return publicConfig.value!
    }

    isLoading.value = true
    error.value = null

    try {
      const data = await getPublicConfig()
      publicConfig.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch public config')
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    publicConfig,
    isLoading,
    error,
    termsVersion,
    fetchPublicConfig,
  }
})
