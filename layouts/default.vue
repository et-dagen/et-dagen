<template>
  <div class="main">
    <!-- navigation menu -->
    <NavVertical />
    <NavHorizontal />

    <!-- main content -->
    <VMain>
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
