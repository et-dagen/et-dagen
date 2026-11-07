<script setup lang="ts">
  import { Ellipsis, X } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import { isActivePanel, panelsFor, phoneTabs } from '@/lib/admin/panels'
  import type { Panel } from '@/lib/admin/panels'
  import { Button } from '@/components/ui/button'

  const localePath = useLocalePath()
  const auth = useAuthStore()
  const { tabs, more } = phoneTabs(panelsFor(auth.allows('admin'), auth.allows))
  const route = useRoute()
  const isActive = (panel: Panel) =>
    isActivePanel(
      panel,
      route.path,
      localePath(panel.route),
      panel.below && localePath(panel.below),
    )
  const moreActive = computed(() => more.some(isActive))

  // a native modal, as the site's phone menu: it traps focus, and Escape closes it
  const sheet = ref<HTMLDialogElement | null>(null)
  const close = () => sheet.value?.close()
  watch(() => route.fullPath, close)
  // a tap on a link, or on the dimmed page around the sheet, closes it too
  const onSheetClick = (event: MouseEvent) => {
    const target = event.target
    if (
      target === sheet.value ||
      (target instanceof Element && target.closest('a'))
    )
      close()
  }

  const tab = [
    'group flex h-14 w-full min-w-14 flex-col items-center justify-center gap-1',
    'rounded-md px-1.5 text-xs font-semibold data-[active=true]:bg-white',
  ]
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="fixed inset-x-0 bottom-0 z-10 bg-brand px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-brand-foreground"
  >
    <!-- a tab is never narrower than its name; the panels that do not fit go behind "More" -->
    <ul
      class="grid auto-cols-[minmax(max-content,1fr)] grid-flow-col gap-1 overflow-x-auto [scrollbar-width:none]"
    >
      <li v-for="panel in tabs" :key="panel.name">
        <NuxtLink
          :to="localePath(panel.route)"
          :data-active="isActive(panel)"
          :aria-current="isActive(panel) ? 'page' : undefined"
          :class="tab"
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
      <li v-if="more.length">
        <button
          type="button"
          :data-active="moreActive"
          aria-haspopup="dialog"
          :class="tab"
          @click="sheet?.showModal()"
        >
          <Ellipsis
            class="size-5 group-data-[active=true]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="group-data-[active=true]:text-brand">
            {{ $t('admin.shell.more') }}
          </span>
        </button>
      </li>
    </ul>

    <dialog
      v-if="more.length"
      ref="sheet"
      :aria-label="$t('admin.shell.more')"
      class="m-0 mt-auto max-h-none w-full max-w-none rounded-t-xl bg-card p-0 text-foreground backdrop:bg-black/40"
      @click="onSheetClick"
    >
      <div class="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div class="flex items-center justify-between">
          <p class="font-bold">{{ $t('admin.shell.more') }}</p>
          <Button
            variant="ghost"
            size="icon"
            class="-mr-2 size-11"
            :aria-label="$t('admin.shell.close')"
            @click="close"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <ul class="flex flex-col gap-1">
          <li v-for="panel in more" :key="panel.name">
            <NuxtLink
              :to="localePath(panel.route)"
              :aria-current="isActive(panel) ? 'page' : undefined"
              class="flex h-12 items-center gap-3 rounded-md px-3 font-semibold aria-[current=page]:bg-brand aria-[current=page]:text-brand-foreground"
            >
              <component
                :is="panel.icon"
                class="size-5"
                stroke-width="1.5"
                aria-hidden="true"
              />
              {{ $t(panel.label) }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </dialog>
  </nav>
</template>
