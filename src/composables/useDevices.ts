import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { listDevices, revokeDevice } from '@/lib/api/devices'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/lib/utils/api-error'

const DEVICES_QUERY_KEY = ['devices'] as const

/**
 * Composable for fetching user's registered devices.
 *
 * Uses TanStack Query for automatic caching, background refetch,
 * and loading/error state management.
 */
export function useDevices() {
  return useQuery({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: () => listDevices(),
    staleTime: 1000 * 30,
  })
}

/**
 * Composable for revoking a device.
 *
 * Returns `{ mutation }` — call `mutation.mutate({ deviceId })`. On success
 * invalidates the devices query and shows a toast; on error shows a toast.
 * (Return shape mirrors useRevokeApiKey for consistency.)
 */
export function useRevokeDevice() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ deviceId }: { deviceId: string }) => revokeDevice(deviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY })
      toast.success('Device revoked successfully')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })

  return { mutation }
}
