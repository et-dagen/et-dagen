<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <tr
    data-slot="table-row"
    :class="
      cn(
        'tw:hover:bg-muted/50 tw:data-[state=selected]:bg-muted tw:border-b tw:transition-colors',
        props.class,
      )
    "
  >
    <slot />
  </tr>
</template>
