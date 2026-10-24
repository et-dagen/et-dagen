<script setup lang="ts">
  import { ArrowDown, ArrowUp, ChevronsUpDown } from '@lucide/vue'
  import type { SortDirection } from '@/lib/admin/listView'

  defineProps<{ label: string; direction: SortDirection | null }>()
  defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-bold tw:tracking-[0.06em] tw:uppercase tw:hover:text-foreground"
    :class="direction ? 'tw:text-foreground' : 'tw:text-muted-foreground'"
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
      class="tw:size-3.5"
      aria-hidden="true"
    />
  </button>
</template>
