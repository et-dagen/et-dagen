<template>
  <div class="tw:flex tw:flex-col">
    <SiteHeader />

    <main id="main" class="tw:min-h-screen">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>
