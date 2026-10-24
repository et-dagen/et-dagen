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
    class="sticky top-0 flex h-dvh flex-col bg-brand px-4 py-6 text-brand-foreground"
  >
    <p class="mb-8 flex h-10 items-center gap-2 px-2">
      <span class="text-xl font-extrabold tracking-tight">E&amp;T-dagene</span>
      <span
        class="rounded-[3px] px-1.5 pt-px text-[11px] font-bold tracking-[0.08em] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.55)]"
      >
        ADMIN
      </span>
    </p>

    <ul class="flex flex-col gap-2">
      <li v-for="panel in ADMIN_PANELS" :key="panel.name">
        <NuxtLink
          :to="localePath(`/admin/${panel.name}`)"
          class="group relative flex h-12 items-center gap-3 rounded-md bg-brand-strong px-4 pt-0.5 text-[15px] font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] transition-colors hover:bg-brand-strong/70 aria-[current=page]:bg-white aria-[current=page]:shadow-none"
        >
          <component
            :is="panel.icon"
            class="size-5 shrink-0 group-aria-[current=page]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="group-aria-[current=page]:text-brand">
            {{ $t(`admin.${panel.name}.name`) }}
          </span>
          <span
            v-if="counts[panel.name]?.value != null"
            class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] px-1.5 pt-0.5 text-[13px] leading-none tabular-nums text-brand-foreground/80 group-aria-[current=page]:bg-brand group-aria-[current=page]:text-brand-foreground"
          >
            {{ counts[panel.name]?.value }}
          </span>
          <span
            aria-hidden="true"
            class="absolute top-4 -right-2 hidden size-0 border-y-8 border-l-8 border-y-transparent border-l-white group-aria-[current=page]:block"
          />
        </NuxtLink>
      </li>
    </ul>

    <div
      class="mt-auto flex items-center gap-3 border-t border-white/20 px-2 pt-4"
    >
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold">{{ auth.user?.name }}</p>
        <NuxtLink
          :to="localePath('/')"
          class="flex items-center gap-1 text-xs opacity-75 hover:opacity-100"
        >
          <ArrowUpLeft class="size-3.5" aria-hidden="true" />
          {{ $t('admin.shell.back') }}
        </NuxtLink>
      </div>
      <ThemeToggle />
    </div>
  </nav>
</template>
