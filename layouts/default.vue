<template>
  <div>
    <!-- navigation menu -->
    <NavVertical v-model="drawer" :routes="routes" />
    <NavHorizontal :routes="routes" @toggle-drawer="() => (drawer = !drawer)" />

    <!-- main content -->
    <VMain class="ma-10" style="min-height: 2000px">
      <slot />
    </VMain>
  </div>
</template>

<script setup lang="ts">
  const { mobile } = useDisplay()
  const { currentRoute } = useRouter()

  // navigation drawer state
  // true: open
  const drawer = ref(false)

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
  watch([mobile, currentRoute], () => (drawer.value = false))
</script>
