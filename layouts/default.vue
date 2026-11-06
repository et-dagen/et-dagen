<script setup lang="ts">
  import SiteFooter from '@/components/site/Footer.vue'
  import SiteHeader from '@/components/site/Header.vue'
</script>

<template>
  <div class="et-ui flex min-h-dvh flex-col">
    <SiteHeader />
    <!-- the space and height Vuetify's VMain gave every page, which the pages were designed with -->
    <main id="main" class="min-h-screen flex-1 pt-[90px]">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
