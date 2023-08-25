<template>
  <div>
    <!-- navigation menu -->
    <NavVertical v-model="drawer" />
    <NavHorizontal @toggleDrawer="() => (drawer = !drawer)" />

    <!-- main content -->
    <VMain class="ma-10" style="min-height: 2000px">
      <slot />
    </VMain>
  </div>
</template>

<script setup lang="ts" ?>
  const drawer = ref(false)
</script>
