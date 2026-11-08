<script setup lang="ts">
  import type { TabsTriggerProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { TabsTrigger, useForwardProps } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = defineProps<
    TabsTriggerProps & { class?: HTMLAttributes['class'] }
  >()

  const delegatedProps = reactiveOmit(props, 'class')

  const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="
      cn(
        `tw:data-[state=active]:bg-background tw:dark:data-[state=active]:text-foreground tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:focus-visible:outline-ring tw:dark:data-[state=active]:border-input tw:dark:data-[state=active]:bg-input/30 tw:text-foreground tw:dark:text-muted-foreground tw:inline-flex tw:h-[calc(100%-1px)] tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-md tw:border tw:border-transparent tw:px-2 tw:py-1 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:transition-[color,box-shadow] tw:focus-visible:ring-3 tw:focus-visible:outline-1 tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:data-[state=active]:shadow-sm tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>
