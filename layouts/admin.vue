<script setup lang="ts">
  import { ArrowUpLeft } from '@lucide/vue'
  import BottomBar from '@/components/admin/BottomBar.vue'
  import Rail from '@/components/admin/Rail.vue'

  const localePath = useLocalePath()
</script>

<template>
  <div
    class="et-admin tw:min-h-dvh tw:lg:grid tw:lg:grid-cols-[240px_minmax(0,1fr)]"
  >
    <Rail class="tw:hidden tw:lg:flex" />

    <header
      class="tw:flex tw:h-14 tw:items-center tw:justify-between tw:bg-brand tw:px-4 tw:text-brand-foreground tw:lg:hidden"
    >
      <p class="tw:text-lg tw:font-extrabold tw:tracking-tight">
        E&amp;T-dagene
      </p>
      <NuxtLink
        :to="localePath('/')"
        class="tw:-mr-2 tw:flex tw:h-11 tw:items-center tw:gap-1 tw:px-2 tw:text-sm tw:font-semibold"
      >
        <ArrowUpLeft class="tw:size-4" aria-hidden="true" />
        {{ $t('admin.shell.back') }}
      </NuxtLink>
    </header>

    <main class="tw:min-w-0 tw:px-4 tw:pt-6 tw:pb-28 tw:lg:px-8 tw:lg:py-8">
      <slot />
    </main>

    <BottomBar class="tw:lg:hidden" />
  </div>
</template>
