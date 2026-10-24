<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <caption
    data-slot="table-caption"
    :class="cn('tw:text-muted-foreground tw:mt-4 tw:text-sm', props.class)"
  >
    <slot />
  </caption>
</template>
