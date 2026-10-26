<script setup lang="ts">
  import { isActivePanel, panelsFor } from '@/lib/admin/panels'

  const localePath = useLocalePath()
  const panels = panelsFor(useAuthStore().allows('admin'))
  const route = useRoute()
  const isActive = (panel: (typeof panels)[number]) =>
    isActivePanel(panel, route.path, localePath(panel.route))

  const list = ref<HTMLUListElement | null>(null)
  onMounted(() =>
    list.value
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' }),
  )
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-10 tw:bg-brand tw:px-2 tw:pt-2 tw:pb-[max(0.5rem,env(safe-area-inset-bottom))] tw:text-brand-foreground"
  >
    <!-- the panels share the width while their names fit, and scroll sideways once they do not -->
    <ul
      ref="list"
      class="tw:grid tw:auto-cols-[minmax(4.75rem,1fr)] tw:grid-flow-col tw:gap-1 tw:overflow-x-auto tw:[scrollbar-width:none]"
    >
      <li v-for="panel in panels" :key="panel.name">
        <NuxtLink
          :to="localePath(panel.route)"
          :data-active="isActive(panel)"
          :aria-current="isActive(panel) ? 'page' : undefined"
          class="tw:group tw:flex tw:h-14 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-md tw:text-xs tw:font-semibold tw:data-[active=true]:bg-white"
        >
          <component
            :is="panel.icon"
            class="tw:size-5 tw:group-data-[active=true]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="tw:group-data-[active=true]:text-brand">
            {{ $t(panel.label) }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
