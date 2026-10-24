<script setup lang="ts">
  import type { SelectItemProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { Check } from '@lucide/vue'
  import { reactiveOmit } from '@vueuse/core'
  import {
    SelectItem,
    SelectItemIndicator,
    SelectItemText,
    useForwardProps,
  } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    SelectItemProps & { class?: HTMLAttributes['class'] }
  >()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    data-slot="select-item"
    v-bind="forwardedProps"
    :class="
      cn(
        `tw:focus:bg-accent tw:focus:text-accent-foreground tw:[&_svg:not([class*='text-'])]:text-muted-foreground tw:relative tw:flex tw:w-full tw:cursor-default tw:items-center tw:gap-2 tw:rounded-sm tw:py-1.5 tw:pr-8 tw:pl-2 tw:text-sm tw:outline-hidden tw:select-none tw:data-[disabled]:pointer-events-none tw:data-[disabled]:opacity-50 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4 tw:*:[span]:last:flex tw:*:[span]:last:items-center tw:*:[span]:last:gap-2`,
        props.class,
      )
    "
  >
    <span
      class="tw:absolute tw:right-2 tw:flex tw:size-3.5 tw:items-center tw:justify-center"
    >
      <SelectItemIndicator>
        <slot name="indicator-icon">
          <Check class="tw:size-4" />
        </slot>
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
