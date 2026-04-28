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
 * Returns a mutation that invalidates the devices query on success
 * and shows a toast notification.
 */
export function useRevokeDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deviceId }: { deviceId: string }) => revokeDevice(deviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY })
      toast.success('Device revoked successfully')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
