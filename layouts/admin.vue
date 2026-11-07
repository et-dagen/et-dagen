<script setup lang="ts">
  import { ArrowUpLeft } from '@lucide/vue'
  import BottomBar from '@/components/admin/BottomBar.vue'
  import Rail from '@/components/admin/Rail.vue'

  const localePath = useLocalePath()
</script>

<template>
  <div class="et-admin min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <Rail class="hidden lg:flex" />

    <header
      class="flex h-14 items-center justify-between bg-brand px-4 text-brand-foreground lg:hidden"
    >
      <p class="text-lg font-extrabold tracking-tight">E&amp;T-dagene</p>
      <NuxtLink
        :to="localePath('/')"
        class="-mr-2 flex h-11 items-center gap-1 px-2 text-sm font-semibold"
      >
        <ArrowUpLeft class="size-4" aria-hidden="true" />
        {{ $t('admin.shell.back') }}
      </NuxtLink>
    </header>

    <main class="min-w-0 px-4 pt-6 pb-28 lg:px-8 lg:py-8">
      <slot />
    </main>

    <BottomBar class="lg:hidden" />
  </div>
</template>
