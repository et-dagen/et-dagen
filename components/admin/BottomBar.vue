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
    'tw:group tw:flex tw:h-14 tw:w-full tw:min-w-14 tw:flex-col tw:items-center tw:justify-center tw:gap-1',
    'tw:rounded-md tw:px-1.5 tw:text-xs tw:font-semibold tw:data-[active=true]:bg-white',
  ]
</script>

<template>
  <nav
    :aria-label="$t('admin.shell.navigation')"
    class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-10 tw:bg-brand tw:px-2 tw:pt-2 tw:pb-[max(0.5rem,env(safe-area-inset-bottom))] tw:text-brand-foreground"
  >
    <!-- a tab is never narrower than its name; the panels that do not fit go behind "More" -->
    <ul
      class="tw:grid tw:auto-cols-[minmax(max-content,1fr)] tw:grid-flow-col tw:gap-1 tw:overflow-x-auto tw:[scrollbar-width:none]"
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
            class="tw:size-5 tw:group-data-[active=true]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="tw:group-data-[active=true]:text-brand">
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
            class="tw:size-5 tw:group-data-[active=true]:text-brand"
            stroke-width="1.5"
            aria-hidden="true"
          />
          <span class="tw:group-data-[active=true]:text-brand">
            {{ $t('admin.shell.more') }}
          </span>
        </button>
      </li>
    </ul>

    <dialog
      v-if="more.length"
      ref="sheet"
      :aria-label="$t('admin.shell.more')"
      class="tw:m-0 tw:mt-auto tw:max-h-none tw:w-full tw:max-w-none tw:rounded-t-xl tw:bg-card tw:p-0 tw:text-foreground tw:backdrop:bg-black/40"
      @click="onSheetClick"
    >
      <div
        class="tw:px-4 tw:pt-2 tw:pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div class="tw:flex tw:items-center tw:justify-between">
          <p class="tw:font-bold">{{ $t('admin.shell.more') }}</p>
          <Button
            variant="ghost"
            size="icon"
            class="tw:-mr-2 tw:size-11"
            :aria-label="$t('admin.shell.close')"
            @click="close"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <ul class="tw:flex tw:flex-col tw:gap-1">
          <li v-for="panel in more" :key="panel.name">
            <NuxtLink
              :to="localePath(panel.route)"
              :aria-current="isActive(panel) ? 'page' : undefined"
              class="tw:flex tw:h-12 tw:items-center tw:gap-3 tw:rounded-md tw:px-3 tw:font-semibold tw:aria-[current=page]:bg-brand tw:aria-[current=page]:text-brand-foreground"
            >
              <component
                :is="panel.icon"
                class="tw:size-5"
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
