<script setup lang="ts">
  import { useAuthStore } from '@/stores/authStore'
  import { isActivePanel, panelsFor } from '@/lib/admin/panels'

  const localePath = useLocalePath()
  const auth = useAuthStore()
  const panels = panelsFor(auth.allows('admin'), auth.allows)
  const route = useRoute()
  const isActive = (panel: (typeof panels)[number]) =>
    isActivePanel(
      panel,
      route.path,
      localePath(panel.route),
      panel.below && localePath(panel.below),
    )

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
    class="fixed inset-x-0 bottom-0 z-10 bg-brand px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-brand-foreground"
  >
    <!-- the panels share the width while their names fit, and scroll sideways once they do not;
         a panel is never narrower than its name -->
    <ul
      ref="list"
      class="grid auto-cols-[minmax(max-content,1fr)] grid-flow-col gap-1 overflow-x-auto [scrollbar-width:none]"
    >
      <li v-for="panel in panels" :key="panel.name">
        <NuxtLink
          :to="localePath(panel.route)"
          :data-active="isActive(panel)"
          :aria-current="isActive(panel) ? 'page' : undefined"
          class="group flex h-14 min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold data-[active=true]:bg-white"
        >
          <component
            :is="panel.icon"
            class="size-5 group-data-[active=true]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="group-data-[active=true]:text-brand">
            {{ $t(panel.label) }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
