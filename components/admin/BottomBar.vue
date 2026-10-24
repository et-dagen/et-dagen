<script setup lang="ts">
  import { ADMIN_PANELS } from '@/lib/admin/panels'

  const localePath = useLocalePath()
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-10 tw:bg-brand tw:px-2 tw:pt-2 tw:pb-[max(0.5rem,env(safe-area-inset-bottom))] tw:text-brand-foreground"
  >
    <ul class="tw:grid tw:grid-cols-4 tw:gap-1">
      <li v-for="panel in ADMIN_PANELS" :key="panel.name">
        <NuxtLink
          :to="localePath(`/admin/${panel.name}`)"
          class="tw:group tw:flex tw:h-14 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-md tw:text-xs tw:font-semibold tw:aria-[current=page]:bg-white"
        >
          <component
            :is="panel.icon"
            class="tw:size-5 tw:group-aria-[current=page]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="tw:group-aria-[current=page]:text-brand">
            {{ $t(`admin.${panel.name}.name`) }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
