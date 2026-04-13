<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Feature card data for the auth page showcase grid.
 * Each card displays an icon, title, and description.
 */
export interface Feature {
  /** Icon: emoji character, SVG string, or icon class name */
  icon: string
  /** Card title (e.g., "Type-Safe Forms") */
  title: string
  /** Brief description of the feature */
  description: string
}

const props = withDefaults(
  defineProps<{
    /** Custom class for root element */
    class?: HTMLAttributes['class']
    /** Array of feature cards to display */
    features?: Feature[]
    /** Theme mode for card styling adaptation */
    themeMode?: 'light' | 'dark'
  }>(),
  {
    features: () => [
      {
        icon: '🔒',
        title: 'Type-Safe Forms',
        description: 'Zod-validated inputs with real-time feedback and zero any types.',
      },
      {
        icon: '⚡',
        title: 'Real-time Validation',
        description: 'Instant field-level validation with debounced async checks.',
      },
      {
        icon: '🎨',
        title: 'Premium Motion',
        description: 'Spring-eased animations with staggered entrance and hover effects.',
      },
      {
        icon: '🌓',
        title: 'Dark & Light',
        description: 'Full theme support with DESIGN.md token-based color system.',
      },
      {
        icon: '📱',
        title: 'Responsive Design',
        description: 'Mobile-first layout that adapts from 320px to ultrawide.',
      },
      {
        icon: '🔐',
        title: 'JWT Auth',
        description: 'Secure token management with automatic refresh and concurrency control.',
      },
    ],
    themeMode: 'dark',
  },
)

/** Computed theme class for conditional styling */
const themeClass = computed(() => (props.themeMode === 'light' ? 'feature-showcase--light' : ''))

/** Reactive visibility flags for staggered entrance animation */
const visibleItems = ref(props.features.map(() => false))

/** Trigger staggered entrance on mount with 80ms delay per card */
onMounted(() => {
  props.features.forEach((_, i) => {
    setTimeout(() => {
      visibleItems.value[i] = true
    }, i * 80)
  })
})

/** Compute inline style for animation delay */
function cardStyle(index: number) {
  return { animationDelay: `${index * 80}ms` }
}
</script>

<template>
  <div :class="cn('feature-showcase', themeClass, props.class)">
    <div class="feature-showcase__grid">
      <div
        v-for="(feature, index) in props.features"
        :key="feature.title"
        class="feature-card"
        :class="{ 'feature-card--visible': visibleItems[index] }"
        :style="cardStyle(index)"
      >
        <div class="feature-card__icon">
          <span class="feature-card__icon-emoji">{{ feature.icon }}</span>
        </div>
        <h3 class="feature-card__title">{{ feature.title }}</h3>
        <p class="feature-card__description">{{ feature.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   Feature Showcase Grid
   ============================================ */

.feature-showcase {
  width: 100%;
}

.feature-showcase__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .feature-showcase__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .feature-showcase__grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}

/* ============================================
   Feature Card Base
   ============================================ */

.feature-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(25, 26, 27, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition:
    opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.feature-card--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.feature-card:hover {
  border-color: rgba(94, 106, 210, 0.3);
  background: rgba(25, 26, 27, 0.8);
  box-shadow:
    0 0 0 1px rgba(94, 106, 210, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px) scale(1.01);
}

/* Light mode: white glass cards */
.feature-showcase--light .feature-card {
  background: rgba(255, 255, 255, 0.9);
  border-color: #d0d6e0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 4px 8px rgba(0, 0, 0, 0.06);
}

.feature-showcase--light .feature-card:hover {
  border-color: rgba(94, 106, 210, 0.4);
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.08),
    0 16px 32px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px) scale(1.01);
}

/* ============================================
   Card Icon
   ============================================ */

.feature-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: rgba(94, 106, 210, 0.1);
  border: 1px solid rgba(94, 106, 210, 0.15);
}

.feature-showcase--light .feature-card__icon {
  background: rgba(94, 106, 210, 0.08);
  border-color: rgba(94, 106, 210, 0.12);
}

.feature-card__icon-emoji {
  font-size: 1.125rem;
  line-height: 1;
}

/* ============================================
   Card Title
   ============================================ */

.feature-card__title {
  margin: 0;
  font-family:
    'Inter Variable',
    SF Pro Display,
    -apple-system,
    system-ui,
    sans-serif;
  font-feature-settings: 'cv01', 'ss03';
  font-size: 0.8125rem;
  font-weight: 510;
  color: #f7f8f8;
  letter-spacing: -0.01em;
  line-height: 1.33;
}

.feature-showcase--light .feature-card__title {
  color: #1a1a2e;
}

/* ============================================
   Card Description
   ============================================ */

.feature-card__description {
  margin: 0;
  font-family:
    'Inter Variable',
    SF Pro Display,
    -apple-system,
    system-ui,
    sans-serif;
  font-feature-settings: 'cv01', 'ss03';
  font-size: 0.75rem;
  font-weight: 400;
  color: #8a8f98;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

.feature-showcase--light .feature-card__description {
  color: #62666d;
}

/* ============================================
   Reduced Motion Support
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .feature-card {
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
