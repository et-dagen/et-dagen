<template>
  <div>
    <!-- navigation menu -->
    <NavVertical :routes="routes" />
    <NavHorizontal :routes="routes" />

    <!-- main content -->
    <VMain class="ma-4">
      <slot />
    </VMain>
  </div>
</template>

<script setup lang="ts">
  const { mobile } = useDisplay()
  const { currentRoute } = useRouter()

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

  // close navigation drawer when navigating or leaving mobile breakpiont
  watch([mobile, currentRoute], () => (app.drawer = false))
</script>
