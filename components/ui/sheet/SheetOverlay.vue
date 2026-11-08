<script setup lang="ts">
  import type { DialogOverlayProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { DialogOverlay } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    DialogOverlayProps & { class?: HTMLAttributes['class'] }
  >()

  const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <DialogOverlay
    data-slot="sheet-overlay"
    :class="
      cn(
        'tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out tw:data-[state=closed]:fade-out-0 tw:data-[state=open]:fade-in-0 tw:fixed tw:inset-0 tw:z-50 tw:bg-black/80',
        props.class,
      )
    "
    v-bind="delegatedProps"
  >
    <slot />
  </DialogOverlay>
</template>
