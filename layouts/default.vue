<template>
  <div class="et-ui tw:flex tw:min-h-dvh tw:flex-col">
    <SiteHeader />
    <!-- the space and height Vuetify's VMain gave every page, which the pages were designed with -->
    <main id="main" class="tw:min-h-screen tw:flex-1 tw:pt-[90px]">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
