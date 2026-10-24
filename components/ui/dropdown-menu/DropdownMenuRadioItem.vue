<script setup lang="ts">
  import type {
    DropdownMenuRadioItemEmits,
    DropdownMenuRadioItemProps,
  } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { Circle } from '@lucide/vue'
  import { reactiveOmit } from '@vueuse/core'
  import {
    DropdownMenuItemIndicator,
    DropdownMenuRadioItem,
    useForwardPropsEmits,
  } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    DropdownMenuRadioItemProps & { class?: HTMLAttributes['class'] }
  >()

  const emits = defineEmits<DropdownMenuRadioItemEmits>()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuRadioItem
    data-slot="dropdown-menu-radio-item"
    v-bind="forwarded"
    :class="
      cn(
        `tw:focus:bg-accent tw:focus:text-accent-foreground tw:relative tw:flex tw:cursor-default tw:items-center tw:gap-2 tw:rounded-sm tw:py-1.5 tw:pr-2 tw:pl-8 tw:text-sm tw:outline-hidden tw:select-none tw:data-[disabled]:pointer-events-none tw:data-[disabled]:opacity-50 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
  >
    <span
      class="tw:pointer-events-none tw:absolute tw:left-2 tw:flex tw:size-3.5 tw:items-center tw:justify-center"
    >
      <DropdownMenuItemIndicator>
        <slot name="indicator-icon">
          <Circle class="tw:size-2 tw:fill-current" />
        </slot>
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuRadioItem>
</template>
