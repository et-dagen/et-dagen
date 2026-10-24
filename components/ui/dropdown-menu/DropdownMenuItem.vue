<script setup lang="ts">
  import type { DropdownMenuItemProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { DropdownMenuItem, useForwardProps } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<
      DropdownMenuItemProps & {
        class?: HTMLAttributes['class']
        inset?: boolean
        variant?: 'default' | 'destructive'
      }
    >(),
    {
      variant: 'default',
    },
  )

  const delegatedProps = reactiveOmit(props, 'inset', 'variant', 'class')

  const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DropdownMenuItem
    data-slot="dropdown-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwardedProps"
    :class="
      cn(
        `tw:relative tw:flex tw:cursor-default tw:items-center tw:gap-2 tw:rounded-sm tw:px-2 tw:py-1.5 tw:text-sm tw:outline-hidden tw:select-none tw:focus:bg-accent tw:focus:text-accent-foreground tw:data-[disabled]:pointer-events-none tw:data-[disabled]:opacity-50 tw:data-[inset]:pl-8 tw:data-[variant=destructive]:text-destructive tw:data-[variant=destructive]:focus:bg-destructive/10 tw:data-[variant=destructive]:focus:text-destructive tw:dark:data-[variant=destructive]:focus:bg-destructive/20 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4 tw:[&_svg:not([class*='text-'])]:text-muted-foreground tw:data-[variant=destructive]:*:[svg]:text-destructive`,
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
