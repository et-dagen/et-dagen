<script setup lang="ts">
  import { ADMIN_PANELS } from '@/lib/admin/panels'

  const localePath = useLocalePath()
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="fixed inset-x-0 bottom-0 z-10 bg-brand px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-brand-foreground"
  >
    <ul class="grid grid-cols-4 gap-1">
      <li v-for="panel in ADMIN_PANELS" :key="panel.name">
        <NuxtLink
          :to="localePath(`/admin/${panel.name}`)"
          class="group flex h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold aria-[current=page]:bg-white"
        >
          <component
            :is="panel.icon"
            class="size-5 group-aria-[current=page]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="group-aria-[current=page]:text-brand">
            {{ $t(`admin.${panel.name}.name`) }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
