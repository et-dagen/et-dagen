<script setup lang="ts">
  import type {
    DropdownMenuSubContentEmits,
    DropdownMenuSubContentProps,
  } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { DropdownMenuSubContent, useForwardPropsEmits } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    DropdownMenuSubContentProps & { class?: HTMLAttributes['class'] }
  >()
  const emits = defineEmits<DropdownMenuSubContentEmits>()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuSubContent
    data-slot="dropdown-menu-sub-content"
    v-bind="forwarded"
    :class="
      cn(
        'tw:bg-popover tw:text-popover-foreground tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out tw:data-[state=closed]:fade-out-0 tw:data-[state=open]:fade-in-0 tw:data-[state=closed]:zoom-out-95 tw:data-[state=open]:zoom-in-95 tw:data-[side=bottom]:slide-in-from-top-2 tw:data-[side=left]:slide-in-from-right-2 tw:data-[side=right]:slide-in-from-left-2 tw:data-[side=top]:slide-in-from-bottom-2 tw:z-50 tw:min-w-[8rem] tw:max-w-(--reka-dropdown-menu-content-available-width) tw:origin-(--reka-dropdown-menu-content-transform-origin) tw:overflow-hidden tw:rounded-md tw:border tw:p-1 tw:shadow-lg',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuSubContent>
</template>
