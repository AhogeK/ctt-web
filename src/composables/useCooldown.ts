import { ref, computed, onUnmounted } from 'vue'

/**
 * Generic cooldown timer for rate-limited actions.
 *
 * @param initialSeconds - Initial cooldown duration in seconds (default: 60)
 * @returns Object with countdown ref, isActive flag, and start function
 */
export function useCooldown(initialSeconds = 60) {
  const countdown = ref(0)
  const isActive = computed(() => countdown.value > 0)
  let timer: ReturnType<typeof setInterval> | null = null

  const start = (seconds = initialSeconds) => {
    countdown.value = seconds
    if (timer) clearInterval(timer)

    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { countdown, isActive, start }
}
