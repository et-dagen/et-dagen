<script setup lang="ts">
  import { ArrowUpLeft } from '@lucide/vue'
  import ThemeToggle from './ThemeToggle.vue'
  import { ADMIN_PANELS } from '@/lib/admin/panels'
  import { usePanelCounts } from '@/composables/admin/usePanelCounts'

  const localePath = useLocalePath()
  const auth = useAuthStore()
  const counts = await usePanelCounts()
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="tw:sticky tw:top-0 tw:flex tw:h-dvh tw:flex-col tw:bg-brand tw:px-4 tw:py-6 tw:text-brand-foreground"
  >
    <p class="tw:mb-8 tw:flex tw:h-10 tw:items-center tw:gap-2 tw:px-2">
      <span class="tw:text-xl tw:font-extrabold tw:tracking-tight"
        >E&amp;T-dagene</span
      >
      <span
        class="tw:rounded-[3px] tw:px-1.5 tw:pt-px tw:text-[11px] tw:font-bold tw:tracking-[0.08em] tw:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.55)]"
      >
        ADMIN
      </span>
    </p>

    <ul class="tw:flex tw:flex-col tw:gap-2">
      <li v-for="panel in ADMIN_PANELS" :key="panel.name">
        <NuxtLink
          :to="localePath(`/admin/${panel.name}`)"
          class="tw:group tw:relative tw:flex tw:h-12 tw:items-center tw:gap-3 tw:rounded-md tw:bg-brand-strong tw:px-4 tw:pt-0.5 tw:text-[15px] tw:font-semibold tw:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] tw:transition-colors tw:hover:bg-brand-strong/70 tw:aria-[current=page]:bg-white tw:aria-[current=page]:shadow-none"
        >
          <component
            :is="panel.icon"
            class="tw:size-5 tw:shrink-0 tw:group-aria-[current=page]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="tw:group-aria-[current=page]:text-brand">
            {{ $t(`admin.${panel.name}.name`) }}
          </span>
          <span
            v-if="counts[panel.name]?.value != null"
            class="tw:ml-auto tw:inline-flex tw:h-5 tw:min-w-5 tw:items-center tw:justify-center tw:rounded-[3px] tw:px-1.5 tw:pt-0.5 tw:text-[13px] tw:leading-none tw:tabular-nums tw:text-brand-foreground/80 tw:group-aria-[current=page]:bg-brand tw:group-aria-[current=page]:text-brand-foreground"
          >
            {{ counts[panel.name]?.value }}
          </span>
          <span
            aria-hidden="true"
            class="tw:absolute tw:top-4 tw:-right-2 tw:hidden tw:size-0 tw:border-y-8 tw:border-l-8 tw:border-y-transparent tw:border-l-white tw:group-aria-[current=page]:block"
          />
        </NuxtLink>
      </li>
    </ul>

    <div
      class="tw:mt-auto tw:flex tw:items-center tw:gap-3 tw:border-t tw:border-white/20 tw:px-2 tw:pt-4"
    >
      <div class="tw:min-w-0 tw:flex-1">
        <p class="tw:truncate tw:font-semibold">{{ auth.user?.name }}</p>
        <NuxtLink
          :to="localePath('/')"
          class="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:opacity-75 tw:hover:opacity-100"
        >
          <ArrowUpLeft class="tw:size-3.5" aria-hidden="true" />
          {{ $t('admin.shell.back') }}
        </NuxtLink>
      </div>
      <ThemeToggle />
    </div>
  </nav>
</template>
