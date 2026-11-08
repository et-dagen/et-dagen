<script setup lang="ts">
  import type { RadioGroupItemProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { CircleIcon } from '@lucide/vue'
  import { reactiveOmit } from '@vueuse/core'
  import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    RadioGroupItemProps & { class?: HTMLAttributes['class'] }
  >()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    data-slot="radio-group-item"
    v-bind="forwardedProps"
    :class="
      cn(
        'tw:border-input tw:text-primary tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:aria-invalid:ring-destructive/20 tw:dark:aria-invalid:ring-destructive/40 tw:aria-invalid:border-destructive tw:dark:bg-input/30 tw:aspect-square tw:size-4 tw:shrink-0 tw:rounded-full tw:border tw:shadow-xs tw:transition-[color,box-shadow] tw:outline-none tw:focus-visible:ring-3 tw:disabled:cursor-not-allowed tw:disabled:opacity-50',
        props.class,
      )
    "
  >
    <RadioGroupIndicator
      data-slot="radio-group-indicator"
      class="tw:relative tw:flex tw:items-center tw:justify-center"
    >
      <slot>
        <CircleIcon
          class="tw:fill-primary tw:absolute tw:top-1/2 tw:left-1/2 tw:size-2 tw:-translate-x-1/2 tw:-translate-y-1/2"
        />
      </slot>
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
