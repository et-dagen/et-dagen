<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <div
    data-slot="card-action"
    :class="
      cn(
        'tw:col-start-2 tw:row-span-2 tw:row-start-1 tw:self-start tw:justify-self-end',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
