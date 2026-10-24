<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <div
    data-slot="alert-dialog-header"
    :class="
      cn(
        'tw:flex tw:flex-col tw:gap-2 tw:text-center tw:sm:text-left',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
