<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="sheet-footer"
    :class="cn('tw:mt-auto tw:flex tw:flex-col tw:gap-2 tw:p-4', props.class)"
  >
    <slot />
  </div>
</template>
