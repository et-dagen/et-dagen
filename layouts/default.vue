<script setup lang="ts">
  import NavHorizontal from '@/components/site/NavBar.vue'
  import NavVertical from '@/components/site/NavDrawer.vue'
  import Footer from '@/components/site/Footer.vue'
</script>

<template>
  <div class="main">
    <!-- navigation menu -->
    <NavVertical />
    <NavHorizontal />

    <!-- main content -->
    <VMain id="main" style="min-height: 100vh">
      <slot />
    </VMain>

    <Footer />
  </div>
</template>

<style scoped lang="scss">
  .main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
