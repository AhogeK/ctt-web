<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="max-h-screen leading-normal lg:flex lg:items-center lg:pr-8">
    <img
      alt="Vue logo"
      class="mx-auto mb-8 block lg:mb-0 lg:mr-8"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="flex flex-wrap items-start">
      <nav class="mt-8 w-full text-center text-xs lg:mt-4 lg:ml-[-1rem] lg:text-left lg:text-base">
        <RouterLink
          to="/"
          class="inline-block border-l border-border px-4 py-0 first:border-0 lg:py-4"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/about"
          class="inline-block border-l border-border px-4 py-0 first:border-0 lg:py-4"
        >
          About
        </RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>
