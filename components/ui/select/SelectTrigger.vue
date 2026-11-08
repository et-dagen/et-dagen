<script setup lang="ts">
  import type { SelectTriggerProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { ChevronDown } from '@lucide/vue'
  import { reactiveOmit } from '@vueuse/core'
  import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<
      SelectTriggerProps & {
        class?: HTMLAttributes['class']
        size?: 'sm' | 'default'
      }
    >(),
    { size: 'default' },
  )

  const delegatedProps = reactiveOmit(props, 'class', 'size')
  const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="
      cn(
        `tw:border-input tw:data-[placeholder]:text-muted-foreground tw:[&_svg:not([class*='text-'])]:text-muted-foreground tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:aria-invalid:ring-destructive/20 tw:dark:aria-invalid:ring-destructive/40 tw:aria-invalid:border-destructive tw:dark:bg-input/30 tw:dark:hover:bg-input/50 tw:flex tw:w-fit tw:items-center tw:justify-between tw:gap-2 tw:rounded-md tw:border tw:bg-transparent tw:px-3 tw:py-2 tw:text-sm tw:whitespace-nowrap tw:shadow-xs tw:transition-[color,box-shadow] tw:outline-none tw:focus-visible:ring-3 tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:data-[size=default]:h-9 tw:data-[size=sm]:h-8 tw:*:data-[slot=select-value]:line-clamp-1 tw:*:data-[slot=select-value]:flex tw:*:data-[slot=select-value]:items-center tw:*:data-[slot=select-value]:gap-2 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="tw:size-4 tw:opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
