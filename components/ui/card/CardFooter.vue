<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <div
    data-slot="card-footer"
    :class="
      cn('tw:flex tw:items-center tw:px-6 tw:[.border-t]:pt-6', props.class)
    "
  >
    <slot />
  </div>
</template>
