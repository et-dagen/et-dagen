<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <tbody
    data-slot="table-body"
    :class="cn('tw:[&_tr:last-child]:border-0', props.class)"
  >
    <slot />
  </tbody>
</template>
