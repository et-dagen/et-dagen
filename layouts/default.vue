<template>
  <div class="main">
    <SiteHeader />

    <!-- main content -->
    <VMain id="main" style="min-height: 100vh">
      <slot />
    </VMain>

    <SiteFooter />
  </div>
</template>

<style scoped lang="scss">
  .main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
