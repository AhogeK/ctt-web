<script setup lang="ts">
import { useCardTilt } from '@/composables/useCardTilt'

const tilt = useCardTilt({
  intensity: 8,
  baseRotateX: 18,
  baseRotateY: -25,
  baseRotateZ: -4,
  translateZ: -60,
  depthMultiplier: 0.5,
})
</script>

<template>
  <div
    class="auth-card-3d auth-card-3d--terminal"
    @mousemove="tilt.handleMouseMove"
    @mouseenter="tilt.handleMouseEnter"
    @mouseleave="tilt.handleMouseLeave"
    :style="{
      transform: tilt.transform.value,
      '--sheen-x': tilt.sheenX.value,
      '--sheen-y': tilt.sheenY.value,
    }"
  >
    <div class="auth-card-3d__sheen" />
    <div class="auth-card-3d__inner auth-card-3d__terminal-inner">
      <div class="auth-terminal__header">
        <div class="auth-terminal__dots">
          <span class="auth-terminal__dot auth-terminal__dot--red" />
          <span class="auth-terminal__dot auth-terminal__dot--yellow" />
          <span class="auth-terminal__dot auth-terminal__dot--green" />
        </div>
        <span class="auth-terminal__title">ctt-stats</span>
      </div>
      <div class="auth-terminal__body">
        <div class="auth-terminal__line">
          <span class="auth-terminal__prompt">&gt;</span>
          <span class="auth-terminal__text"
            >Total coding time: <span class="auth-terminal__value">342h 15m</span></span
          >
        </div>
        <div class="auth-terminal__line">
          <span class="auth-terminal__prompt">&gt;</span>
          <span class="auth-terminal__text"
            >Top language: <span class="auth-terminal__value--accent">TypeScript (68%)</span></span
          >
        </div>
        <div class="auth-terminal__line">
          <span class="auth-terminal__prompt">&gt;</span>
          <span class="auth-terminal__text"
            >Longest session: <span class="auth-terminal__value">4h 23m</span></span
          >
        </div>
        <div class="auth-terminal__line">
          <span class="auth-terminal__prompt">&gt;</span>
          <span class="auth-terminal__text"
            >Active days: <span class="auth-terminal__value">89/90</span></span
          >
        </div>
        <div class="auth-terminal__line">
          <span class="auth-terminal__prompt">&gt;</span>
          <span class="auth-terminal__text"
            >Current streak: <span class="auth-terminal__streak">12 days</span></span
          >
          <span class="auth-terminal__cursor" />
        </div>
      </div>
    </div>
  </div>
</template>
