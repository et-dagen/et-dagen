<script setup lang="ts">
  import { Paperclip } from '@lucide/vue'

  /**
   * A file picker drawn as the site's filled field: a paperclip, then a grey box with an
   * underline whose label rests inside until a file is chosen, or until `active` holds it up.
   */
  const props = defineProps<{
    label: string
    accept?: string
    active?: boolean
    fileName?: string
  }>()
  const emit = defineEmits<{ choose: [file: File | null] }>()

  const id = useId()
  const floated = computed(() => props.active || !!props.fileName)

  const choose = (event: Event) => {
    const input = event.target as HTMLInputElement
    emit('choose', input.files?.[0] ?? null)
    // the same file may be chosen again after it is deleted
    input.value = ''
  }
</script>

<template>
  <div class="tw:flex tw:w-full tw:items-start tw:pb-[22px]">
    <Paperclip
      aria-hidden="true"
      class="tw:mt-4 tw:me-4 tw:size-6 tw:shrink-0 tw:text-black/60"
    />
    <label
      :for="id"
      class="tw:relative tw:block tw:h-14 tw:flex-1 tw:cursor-pointer tw:rounded-t tw:border-b tw:border-black/38 tw:bg-black/4 tw:hover:border-black/87 tw:hover:bg-black/8 tw:has-focus-visible:border-black/87 tw:has-focus-visible:shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.87)]"
    >
      <input
        :id="id"
        type="file"
        :accept="accept"
        class="tw:sr-only"
        @change="choose"
      />
      <span
        class="tw:absolute tw:left-4 tw:tracking-[0.009375em] tw:text-black/60 tw:transition-all tw:duration-150"
        :class="
          floated
            ? 'tw:top-1.5 tw:text-xs tw:leading-[18px]'
            : 'tw:top-4 tw:text-base tw:leading-6'
        "
      >
        {{ label }}
      </span>
      <span
        v-if="fileName"
        class="tw:absolute tw:right-4 tw:bottom-1.5 tw:left-4 tw:truncate tw:text-base tw:leading-6"
      >
        {{ fileName }}
      </span>
    </label>
  </div>
</template>
