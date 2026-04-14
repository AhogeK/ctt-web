<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { RouterView } from 'vue-router'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/app/ThemeToggle.vue'
import AuthBackground from './components/AuthBackground.vue'
import AuthDashboard from './components/AuthDashboard.vue'
import AuthMetricsCard from './components/AuthMetricsCard.vue'
import AuthTerminalCard from './components/AuthTerminalCard.vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('auth-root flex h-screen items-center justify-center overflow-hidden', props.class)"
  >
    <AuthBackground />

    <!-- Main Glass-Morphism Card -->
    <div class="auth-card">
      <div class="auth-card__inner">
        <!-- Left Panel: Isometric Dashboard + 3D Cards -->
        <div class="auth-visual">
          <div class="auth-visual__grid" />
          <div class="auth-visual__stars" />

          <!-- 3D Scene Container — shared perspective vanishing point -->
          <div class="auth-3d-scene">
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
            <ThemeToggle />
          </div>
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./AuthLayout.css" />
