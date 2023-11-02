<template>
  <div>
    <!-- navigation menu -->
    <NavVertical :routes="routes" />
    <NavHorizontal :routes="routes" />

    <!-- main content -->
    <VMain>
      <slot />
    </VMain>
  </div>
</template>

<script setup lang="ts">
  const { mobile } = useDisplay()

  const app = useAppStore()

  // public routes
  const routes = [
    {
      name: 'index',
      route: '/',
    },
    {
      name: 'program',
      route: '/program',
    },
    {
      name: 'jobs',
      route: '/jobs',
    },
    {
      name: 'contact',
      route: '/contact',
    },
  ]

  // close navigation drawer when leaving mobile breakpiont
  watch(mobile, () => (app.drawer = false))
</script>
