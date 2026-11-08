<script setup lang="ts">
  import NavBar from '@/components/site/NavBar.vue'
  import NavDrawer from '@/components/site/NavDrawer.vue'
  import Footer from '@/components/site/Footer.vue'
</script>

<template>
  <div class="et-ui tw:flex tw:min-h-full tw:flex-col">
    <NavDrawer />
    <NavBar />

    <!-- isolated, so nothing on a page rises above the header or the phone menu -->
    <main
      id="main"
      class="tw:isolate tw:min-h-screen tw:flex-[1_0_auto] tw:pt-[90px]"
    >
      <slot />
    </main>

    <Footer />
  </div>
</template>
