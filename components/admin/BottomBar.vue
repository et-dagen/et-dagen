<script setup lang="ts">
  import { panelsFor } from '@/lib/admin/panels'

  const localePath = useLocalePath()
  const panels = panelsFor(useAuthStore().user?.userType)
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-10 tw:bg-brand tw:px-2 tw:pt-2 tw:pb-[max(0.5rem,env(safe-area-inset-bottom))] tw:text-brand-foreground"
  >
    <ul
      class="tw:grid tw:gap-1"
      :style="{
        gridTemplateColumns: `repeat(${panels.length}, minmax(0, 1fr))`,
      }"
    >
      <li v-for="panel in panels" :key="panel.name">
        <NuxtLink
          :to="localePath(panel.route)"
          class="tw:group tw:flex tw:h-14 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-md tw:text-xs tw:font-semibold tw:aria-[current=page]:bg-white"
        >
          <component
            :is="panel.icon"
            class="tw:size-5 tw:group-aria-[current=page]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="tw:group-aria-[current=page]:text-brand">
            {{ $t(panel.label) }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
