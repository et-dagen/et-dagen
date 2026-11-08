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
  import DialogOverlay from './DialogOverlay.vue'
  import { cn } from '@/lib/utils'

  defineOptions({
    inheritAttrs: false,
  })

  const props = withDefaults(
    defineProps<
      DialogContentProps & {
        class?: HTMLAttributes['class']
        showCloseButton?: boolean
      }
    >(),
    {
      showCloseButton: true,
    },
  )
  const emits = defineEmits<DialogContentEmits>()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent
      data-slot="dialog-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'tw:bg-background tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out tw:data-[state=closed]:fade-out-0 tw:data-[state=open]:fade-in-0 tw:data-[state=closed]:zoom-out-95 tw:data-[state=open]:zoom-in-95 tw:fixed tw:top-[50%] tw:left-[50%] tw:z-50 tw:grid tw:w-full tw:max-w-[calc(100%-2rem)] tw:translate-x-[-50%] tw:translate-y-[-50%] tw:gap-4 tw:rounded-lg tw:border tw:p-6 tw:shadow-lg tw:duration-200 tw:sm:max-w-lg',
          props.class,
        )
      "
    >
      <slot />

      <DialogClose
        v-if="showCloseButton"
        data-slot="dialog-close"
        class="tw:ring-offset-background tw:focus:ring-ring tw:data-[state=open]:bg-accent tw:data-[state=open]:text-muted-foreground tw:absolute tw:top-4 tw:right-4 tw:rounded-xs tw:opacity-70 tw:transition-opacity tw:hover:opacity-100 tw:focus:ring-2 tw:focus:ring-offset-2 tw:focus:outline-hidden tw:disabled:pointer-events-none tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4"
      >
        <X />
        <span class="tw:sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
