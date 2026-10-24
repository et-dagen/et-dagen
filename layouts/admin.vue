<script setup lang="ts">
  import BottomBar from '@/components/admin/BottomBar.vue'
  import Rail from '@/components/admin/Rail.vue'
  import ThemeToggle from '@/components/admin/ThemeToggle.vue'
  import { useAdminTheme } from '@/composables/useAdminTheme'

  const { theme } = useAdminTheme()

  // on <html> so menus and dialogs, which render at the end of <body>, get the palette too
  useHead({
    htmlAttrs: {
      class: 'et-admin-root',
      'data-admin-theme': () =>
        theme.value === 'system' ? undefined : theme.value,
    },
  })
</script>

<template>
  <div class="et-admin min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <Rail class="hidden lg:flex" />

    <header
      class="flex h-14 items-center justify-between bg-brand px-4 text-brand-foreground lg:hidden"
    >
      <p class="text-lg font-extrabold tracking-tight">E&amp;T-dagene</p>
      <ThemeToggle />
    </header>

    <main class="min-w-0 px-4 pt-6 pb-28 lg:px-8 lg:py-8">
      <slot />
    </main>

    <BottomBar class="lg:hidden" />
  </div>
</template>
