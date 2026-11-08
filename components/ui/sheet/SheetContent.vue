<script setup lang="ts">
  import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { X } from '@lucide/vue'
  import { reactiveOmit } from '@vueuse/core'
  import {
    DialogClose,
    DialogContent,
    DialogPortal,
    useForwardPropsEmits,
  } from 'reka-ui'
  import SheetOverlay from './SheetOverlay.vue'
  import { cn } from '@/lib/utils'

  interface SheetContentProps extends DialogContentProps {
    class?: HTMLAttributes['class']
    side?: 'top' | 'right' | 'bottom' | 'left'
  }

  defineOptions({
    inheritAttrs: false,
  })

  const props = withDefaults(defineProps<SheetContentProps>(), {
    side: 'right',
  })
  const emits = defineEmits<DialogContentEmits>()

  const delegatedProps = reactiveOmit(props, 'class', 'side')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <SheetOverlay />
    <DialogContent
      data-slot="sheet-content"
      :class="
        cn(
          'tw:bg-background tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out tw:fixed tw:z-50 tw:flex tw:flex-col tw:gap-4 tw:shadow-lg tw:transition tw:ease-in-out tw:data-[state=closed]:duration-300 tw:data-[state=open]:duration-500',
          side === 'right' &&
            'tw:data-[state=closed]:slide-out-to-right tw:data-[state=open]:slide-in-from-right tw:inset-y-0 tw:right-0 tw:h-full tw:w-3/4 tw:border-l tw:sm:max-w-sm',
          side === 'left' &&
            'tw:data-[state=closed]:slide-out-to-left tw:data-[state=open]:slide-in-from-left tw:inset-y-0 tw:left-0 tw:h-full tw:w-3/4 tw:border-r tw:sm:max-w-sm',
          side === 'top' &&
            'tw:data-[state=closed]:slide-out-to-top tw:data-[state=open]:slide-in-from-top tw:inset-x-0 tw:top-0 tw:h-auto tw:border-b',
          side === 'bottom' &&
            'tw:data-[state=closed]:slide-out-to-bottom tw:data-[state=open]:slide-in-from-bottom tw:inset-x-0 tw:bottom-0 tw:h-auto tw:border-t',
          props.class,
        )
      "
      v-bind="{ ...$attrs, ...forwarded }"
    >
      <slot />

      <DialogClose
        class="tw:ring-offset-background tw:focus:ring-ring tw:data-[state=open]:bg-secondary tw:absolute tw:top-4 tw:right-4 tw:rounded-xs tw:opacity-70 tw:transition-opacity tw:hover:opacity-100 tw:focus:ring-2 tw:focus:ring-offset-2 tw:focus:outline-hidden tw:disabled:pointer-events-none"
      >
        <X class="tw:size-4" />
        <span class="tw:sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
