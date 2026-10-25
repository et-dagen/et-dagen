<script setup lang="ts">
  import { Maximize2, X, ZoomIn, ZoomOut } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  defineProps<{ url: string; day: string }>()

  const dialog = ref<HTMLDialogElement | null>(null)
  const zoomed = ref(false)
  const open = () => {
    zoomed.value = false
    dialog.value?.showModal()
  }
</script>

<template>
  <div>
    <button
      type="button"
      class="tw:group tw:relative tw:block tw:h-24 tw:w-40 tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card tw:sm:h-28 tw:sm:w-48"
      :aria-label="$t('programme.map.open', { day })"
      @click="open"
    >
      <img
        :src="url"
        alt=""
        class="tw:size-full tw:object-cover"
        loading="lazy"
      />
      <span
        class="tw:absolute tw:inset-x-0 tw:bottom-0 tw:flex tw:items-center tw:gap-1 tw:bg-card/95 tw:px-2 tw:py-1 tw:text-xs tw:font-semibold"
      >
        <Maximize2 class="tw:size-3.5" aria-hidden="true" />
        {{ $t('programme.map.name') }}
      </span>
    </button>
    <!-- a native modal: Escape closes it and focus returns to the button -->
    <dialog
      ref="dialog"
      class="tw:m-0 tw:h-dvh tw:max-h-none tw:w-dvw tw:max-w-none tw:bg-foreground/90 tw:p-0 tw:backdrop:bg-transparent"
      :aria-label="$t('programme.map.title', { day })"
    >
      <div class="tw:flex tw:h-full tw:flex-col">
        <div
          class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:p-3 tw:text-white"
        >
          <p class="tw:font-bold">{{ $t('programme.map.title', { day }) }}</p>
          <div class="tw:flex tw:gap-2">
            <Button
              variant="secondary"
              size="icon"
              :aria-label="
                $t(zoomed ? 'programme.map.zoom_out' : 'programme.map.zoom_in')
              "
              @click="zoomed = !zoomed"
            >
              <ZoomOut v-if="zoomed" aria-hidden="true" />
              <ZoomIn v-else aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              :aria-label="$t('programme.map.close')"
              @click="dialog?.close()"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div class="tw:min-h-0 tw:flex-1 tw:overflow-auto tw:p-3">
          <img
            :src="url"
            :alt="$t('programme.map.title', { day })"
            class="tw:mx-auto tw:object-contain"
            :class="zoomed ? 'tw:w-[200%] tw:max-w-none' : 'tw:size-full'"
          />
        </div>
      </div>
    </dialog>
  </div>
</template>
