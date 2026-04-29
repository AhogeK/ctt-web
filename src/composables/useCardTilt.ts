import { ref, computed, onUnmounted } from 'vue'

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

export interface UseCardTiltOptions {
  /** Maximum rotation angle from mouse movement in degrees (default: 8) */
  intensity?: number
  /** Base static rotation X in degrees — the card's resting 3D angle */
  baseRotateX?: number
  /** Base static rotation Y in degrees — the card's resting 3D angle */
  baseRotateY?: number
  /** Base static rotation Z in degrees — adds roll to the 3D angle */
  baseRotateZ?: number
  /** Z-depth offset in pixels — positive = closer, negative = further */
  translateZ?: number
  /** Parallax depth multiplier (0-1.5). Closer cards respond more to mouse. Default: 1.0 */
  depthMultiplier?: number
}

/**
 * Composable for mouse-follow 3D tilt effect with true depth layering.
 *
 * Supports base 3D rotations (static angle), Z-depth positioning, and
 * parallax mouse tracking where closer cards respond more to movement.
 *
 * @param options - Configuration for tilt behavior
 * @returns Reactive transform string, CSS variables for sheen, and event handlers
 */
export function useCardTilt(options: UseCardTiltOptions = {}) {
  const {
    intensity = 8,
    baseRotateX = 0,
    baseRotateY = 0,
    baseRotateZ = 0,
    translateZ = 0,
    depthMultiplier = 1,
  } = options

  const sheenX = ref('50%')
  const sheenY = ref('50%')
  const isHovering = ref(false)

  let rafId: number | null = null
  let targetRotateX = 0
  let targetRotateY = 0
  let currentRotateX = 0
  let currentRotateY = 0

  function animate() {
    currentRotateX = lerp(currentRotateX, targetRotateX, 0.15)
    currentRotateY = lerp(currentRotateY, targetRotateY, 0.15)

    if (Math.abs(currentRotateX) < 0.01) currentRotateX = 0
    if (Math.abs(currentRotateY) < 0.01) currentRotateY = 0

    if (Math.abs(currentRotateX - targetRotateX) > 0.01 || Math.abs(currentRotateY - targetRotateY) > 0.01) {
      rafId = requestAnimationFrame(animate)
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)

    // Parallax: depth multiplier amplifies/reduces mouse response
    targetRotateY = x * intensity * depthMultiplier
    targetRotateX = -y * intensity * depthMultiplier

    sheenX.value = `${e.clientX - rect.left}px`
    sheenY.value = `${e.clientY - rect.top}px`

    if (!rafId) {
      rafId = requestAnimationFrame(animate)
    }
  }

  function handleMouseEnter() {
    isHovering.value = true
  }

  function handleMouseLeave() {
    isHovering.value = false
    targetRotateX = 0
    targetRotateY = 0

    if (!rafId) {
      rafId = requestAnimationFrame(animate)
    }
  }

  /** Combined transform string: base rotation + mouse delta + Z-depth */
  const transform = computed(() => {
    const rx = baseRotateX + currentRotateX
    const ry = baseRotateY + currentRotateY
    const rz = baseRotateZ
    return `translateZ(${translateZ}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
  })

  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })

  return {
    transform,
    sheenX,
    sheenY,
    isHovering,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  }
}
