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
      class="group relative block h-24 w-40 overflow-hidden rounded-lg border bg-card sm:h-28 sm:w-48"
      :aria-label="$t('programme.map.open', { day })"
      @click="open"
    >
      <img :src="url" alt="" class="size-full object-cover" loading="lazy" />
      <span
        class="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-card/95 px-2 py-1 text-xs font-semibold"
      >
        <Maximize2 class="size-3.5" aria-hidden="true" />
        {{ $t('programme.map.name') }}
      </span>
    </button>
    <!-- a native modal: Escape closes it and focus returns to the button -->
    <dialog
      ref="dialog"
      class="m-0 h-dvh max-h-none w-dvw max-w-none bg-foreground p-0 backdrop:bg-transparent"
      :aria-label="$t('programme.map.title', { day })"
    >
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between gap-3 p-3 text-white">
          <p class="font-bold">{{ $t('programme.map.title', { day }) }}</p>
          <div class="flex gap-2">
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
        <div class="min-h-0 flex-1 overflow-auto p-3">
          <img
            :src="url"
            :alt="$t('programme.map.title', { day })"
            class="mx-auto object-contain"
            :class="zoomed ? 'w-[200%] max-w-none' : 'size-full'"
          />
        </div>
      </div>
    </dialog>
  </div>
</template>
