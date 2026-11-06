<script setup lang="ts">
  import { ArrowDown, ArrowUp, ChevronsUpDown } from '@lucide/vue'
  import type { SortDirection } from '@/lib/admin/listView'

  defineProps<{ label: string; direction: SortDirection | null }>()
  defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 text-xs font-bold tracking-[0.06em] uppercase hover:text-foreground"
    :class="direction ? 'text-foreground' : 'text-muted-foreground'"
    @click="$emit('toggle')"
  >
    {{ label }}
    <component
      :is="
        direction === 'asc'
          ? ArrowUp
          : direction === 'desc'
            ? ArrowDown
            : ChevronsUpDown
      "
      class="size-3.5"
      aria-hidden="true"
    />
  </button>
</template>
