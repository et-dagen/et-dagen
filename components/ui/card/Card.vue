<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'tw:bg-card tw:text-card-foreground tw:flex tw:flex-col tw:gap-6 tw:rounded-xl tw:border tw:py-6 tw:shadow-sm',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
