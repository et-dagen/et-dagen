<template>
  <div>
    <!-- navigation menu -->
    <NavVertical v-model="drawer" />
    <NavHorizontal @toggle-drawer="() => (drawer = !drawer)" />

    <!-- main content -->
    <VMain class="ma-10" style="min-height: 2000px">
      <slot />
    </VMain>
  </div>
</template>

<script setup lang="ts">
  const { mobile } = useDisplay()
  const { currentRoute } = useRouter()

  const drawer = ref(false)

  watch([mobile, currentRoute], () => (drawer.value = false))
</script>
