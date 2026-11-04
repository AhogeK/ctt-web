<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/app/ThemeToggle.vue'
import LanguageMenu from '@/components/app/LanguageMenu.vue'
import AuthBackground from './components/AuthBackground.vue'
import AuthDashboard from './components/AuthDashboard.vue'
import AuthMetricsCard from './components/AuthMetricsCard.vue'
import { RouteNames } from '@/router/route-names'
import AuthTerminalCard from './components/AuthTerminalCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const route = useRoute()
const cardRef = ref<HTMLElement | null>(null)
let settleTimer: number | null = null

/**
 * Ease the sign-in surface through a step change instead of letting it jump.
 *
 * The steps are not the same height — the code step is shorter than the password step — and the card
 * is centred, so an instant swap moves every edge at once. That reads as the page reloading, which is
 * what brings readers back to the password form thinking they lost their place.
 *
 * The height is applied to the surface (`__inner`), which is the element that carries the background,
 * the shadow and the contents; the card around it sizes itself to that surface, so one pinned element
 * animates everything the reader can see. The height is cleared afterwards, so the surface keeps
 * sizing itself to its content. Reduced motion needs no branch: the document rule that suppresses
 * transitions makes this one finish immediately, and the timeout still cleans up.
 */
watch(
  () => route.fullPath,
  async () => {
    const surface = cardRef.value?.querySelector<HTMLElement>('.auth-card__inner')
    if (!surface) return

    // Whatever the previous swap left behind is measured as the starting point, then dropped: a
    // pinned height that is still in place would read as "no change" and skip the animation.
    const from = surface.getBoundingClientRect().height
    surface.style.height = ''
    surface.style.transition = ''
    if (settleTimer !== null) {
      clearTimeout(settleTimer)
      settleTimer = null
    }

    // A pre-flush watcher runs before the new panel is in the DOM, so this is the outgoing height.
    await nextTick()
    const to = surface.getBoundingClientRect().height
    if (Math.abs(to - from) < 1) return

    surface.style.height = `${from}px`
    // Commit the start value before arming the transition: two writes in one frame collapse into a
    // single style change, and nothing would animate.
    void surface.offsetHeight
    surface.style.transition = 'height 220ms ease'
    surface.style.height = `${to}px`

    settleTimer = window.setTimeout(() => {
      surface.style.height = ''
      surface.style.transition = ''
      settleTimer = null
    }, 400)
  },
  { flush: 'pre' },
)

onUnmounted(() => {
  if (settleTimer !== null) clearTimeout(settleTimer)
})
</script>

<template>
  <div :class="cn('auth-root flex min-h-screen items-center justify-center', props.class)">
    <AuthBackground />

    <!-- Main Glass-Morphism Card -->
    <div ref="cardRef" class="auth-card">
      <div class="auth-card__inner">
        <!-- Left Panel: Isometric Dashboard + 3D Cards -->
        <div class="auth-visual">
          <div class="auth-visual__grid" />
          <div class="auth-visual__stars" />

          <!-- 3D Scene Container — shared perspective vanishing point -->
          <div class="auth-3d-scene">
            <!-- Scene-level underglow: one emitter below every card, so any card occludes it. -->
            <div class="auth-underglow" aria-hidden="true">
              <div class="auth-underglow__emitter" />
            </div>

            <AuthDashboard />
            <div class="auth-cards-container">
              <AuthMetricsCard />
              <AuthTerminalCard />
            </div>
          </div>
        </div>

        <!-- Right Panel: Form Area -->
        <div class="auth-form">
          <div class="auth-form__header">
            <LanguageMenu />
            <ThemeToggle />
          </div>
          <RouterView />
          <p class="auth-form__legal">
            <RouterLink :to="{ name: RouteNames.PRIVACY }" data-testid="auth-privacy-link">
              {{ t('legal.privacy.link') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./AuthLayout.css" />
