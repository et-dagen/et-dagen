<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import TableCell from './TableCell.vue'
  import TableRow from './TableRow.vue'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<{
      class?: HTMLAttributes['class']
      colspan?: number
    }>(),
    {
      colspan: 1,
    },
  )

  const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <TableRow>
    <TableCell
      :class="
        cn(
          'tw:p-4 tw:whitespace-nowrap tw:align-middle tw:text-sm tw:text-foreground',
          props.class,
        )
      "
      v-bind="delegatedProps"
    >
      <div class="tw:flex tw:items-center tw:justify-center tw:py-10">
        <slot />
      </div>
    </TableCell>
  </TableRow>
</template>
