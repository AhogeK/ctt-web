<script setup lang="ts">
// Pure presentational component — no logic needed
</script>

<template>
  <!-- Animated Mesh Gradient Background -->
  <div class="auth-background" />

  <!-- SVG Noise Texture Overlay -->
  <div class="auth-noise">
    <svg width="100%" height="100%">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>

  <!-- Floating Gradient Orbs -->
  <div class="auth-orbs">
    <div class="auth-orb auth-orb--1" />
    <div class="auth-orb auth-orb--2" />
    <div class="auth-orb auth-orb--3" />
    <div class="auth-orb auth-orb--4" />
    <div class="auth-orb auth-orb--5" />
    <div class="auth-orb auth-orb--6" />
  </div>
</template>
