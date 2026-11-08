<script setup lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
  } from '@/components/ui/dialog'

  /** A question in a card: a title, a sentence, anything the answer needs, and the buttons */
  defineProps<{ title: string; text: string }>()
  const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="tw:max-w-[min(500px,calc(100%-3rem))] tw:gap-0 tw:rounded tw:border-0 tw:p-0 tw:shadow-[0_11px_15px_-7px_rgba(0,0,0,0.2),0_24px_38px_3px_rgba(0,0,0,0.14),0_9px_46px_8px_rgba(0,0,0,0.12)] tw:sm:max-w-[min(500px,calc(100%-3rem))]"
    >
      <DialogTitle
        class="tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
      >
        {{ title }}
      </DialogTitle>
      <div class="tw:px-4 tw:pb-4">
        <DialogDescription
          class="tw:text-sm tw:leading-[1.375rem] tw:tracking-[0.0178571429em] tw:text-foreground"
        >
          {{ text }}
        </DialogDescription>
        <slot />
      </div>
      <div
        class="tw:flex tw:min-h-[3.25rem] tw:items-center tw:justify-end tw:gap-2 tw:p-2"
      >
        <slot name="actions" />
      </div>
    </DialogContent>
  </Dialog>
</template>
