<template>
  <div class="main">
    <SiteHeader />

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
