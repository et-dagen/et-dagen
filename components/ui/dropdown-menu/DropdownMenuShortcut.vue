<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <span
    data-slot="dropdown-menu-shortcut"
    :class="
      cn(
        'tw:text-muted-foreground tw:ml-auto tw:text-xs tw:tracking-widest',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
