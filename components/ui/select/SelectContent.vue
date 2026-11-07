<script setup lang="ts">
  import type { SelectContentEmits, SelectContentProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import {
    SelectContent,
    SelectPortal,
    SelectViewport,
    useForwardPropsEmits,
  } from 'reka-ui'
  import { SelectScrollDownButton, SelectScrollUpButton } from '.'
  import { cn } from '@/lib/utils'

  defineOptions({
    inheritAttrs: false,
  })

  const props = withDefaults(
    defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(),
    {
      position: 'popper',
    },
  )
  const emits = defineEmits<SelectContentEmits>()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal>
    <SelectContent
      data-slot="select-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'tw:bg-popover tw:text-popover-foreground tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out tw:data-[state=closed]:fade-out-0 tw:data-[state=open]:fade-in-0 tw:data-[state=closed]:zoom-out-95 tw:data-[state=open]:zoom-in-95 tw:data-[side=bottom]:slide-in-from-top-2 tw:data-[side=left]:slide-in-from-right-2 tw:data-[side=right]:slide-in-from-left-2 tw:data-[side=top]:slide-in-from-bottom-2 tw:relative tw:z-50 tw:max-h-(--reka-select-content-available-height) tw:min-w-[8rem] tw:overflow-x-hidden tw:overflow-y-auto tw:rounded-md tw:border tw:shadow-md',
          position === 'popper' &&
            'tw:data-[side=bottom]:translate-y-1 tw:data-[side=left]:-translate-x-1 tw:data-[side=right]:translate-x-1 tw:data-[side=top]:-translate-y-1',
          props.class,
        )
      "
    >
      <SelectScrollUpButton />
      <SelectViewport
        :class="
          cn(
            'tw:p-1',
            position === 'popper' &&
              'tw:h-(--reka-select-trigger-height) tw:w-full tw:min-w-(--reka-select-trigger-width) tw:scroll-my-1',
          )
        "
      >
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContent>
  </SelectPortal>
</template>
