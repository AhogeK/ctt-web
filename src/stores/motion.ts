import { computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useMediaQuery, useStorage } from '@vueuse/core'

export type MotionPreference = 'system' | 'reduce' | 'full'

/** Storage key for the motion preference. Kept next to the theme key's shape. */
export const MOTION_STORAGE_KEY = 'ctt.motion'

/**
 * Attribute on `<html>` carrying the resolved motion decision.
 *
 * Its value is the *conclusion*, not the choice: `reduce` when motion should be
 * suppressed, `full` when it should play, absent when the visitor has expressed
 * no preference and the system has not asked for less.
 *
 * CSS cannot read `localStorage` and cannot combine a media query with a stored
 * choice, so the decision is resolved here and the stylesheet reads only this
 * attribute. That is what lets an explicit "Full motion" override a system that
 * asks for less — with the media query in charge, no override could win.
 */
export const MOTION_ATTRIBUTE = 'data-motion'

/**
 * Motion preference store.
 *
 * Deliberately separate from the theme store: a visitor can want dark colours and
 * full animation, or light colours and no animation, so the two choices must not
 * share a storage key or a "current mode" concept.
 *
 * Resolution: an explicit choice wins in both directions; `system` follows
 * `prefers-reduced-motion`. The system signal stays live — a visitor who changes
 * the OS setting sees the page follow without reloading.
 */
export const useMotionStore = defineStore('motion', () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const preference = useStorage<MotionPreference>(MOTION_STORAGE_KEY, 'system')

  /**
   * Whether motion should be suppressed right now.
   *
   * Written the same way the first-paint script writes it, so the two cannot
   * disagree: an explicit `reduce` wins, an explicit `full` wins over the
   * system, and anything else — including a value that is not one of the
   * three — follows the system.
   */
  const isReduced = computed(
    () => preference.value === 'reduce' || (preference.value !== 'full' && prefersReducedMotion.value),
  )

  /**
   * Mirror the resolved decision onto `<html>`.
   *
   * `reduce` is written when the choice is to suppress motion — whether that came
   * from the visitor or from the system. `full` is written only when motion should
   * definitely play, which is the one case the media query alone could not express.
   * Neither value is written when the visitor has made no choice and the system
   * allows motion: the stylesheet's own default then applies.
   */
  function applyMotionAttribute(): void {
    const root = document.documentElement
    if (isReduced.value) {
      root.setAttribute(MOTION_ATTRIBUTE, 'reduce')
    } else if (preference.value === 'full') {
      root.setAttribute(MOTION_ATTRIBUTE, 'full')
    } else {
      root.removeAttribute(MOTION_ATTRIBUTE)
    }
  }

  /**
   * Keep the document in step with the stored value, whoever wrote it.
   *
   * `useStorage` writes back on its own in two cases this store never sees: a
   * change in another tab, and the first read after a reload. Watching both
   * sources covers those, so `setPreference` does not have to be the only way in.
   *
   * `flush: 'sync'` on purpose: the attribute is a DOM write, not rendered state,
   * and a batched flush would let a caller read an attribute that contradicts the
   * preference it just wrote.
   */
  watch([preference, prefersReducedMotion], applyMotionAttribute, {
    immediate: true,
    flush: 'sync',
  })

  /** Write a new preference. The watcher applies it. */
  function setPreference(next: MotionPreference): void {
    preference.value = next
  }

  return {
    preference,
    prefersReducedMotion,
    isReduced,
    setPreference,
  }
})
