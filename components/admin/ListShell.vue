<script setup lang="ts">
  import Pager from '@/components/admin/Pager.vue'
  import SelectionBar from '@/components/admin/SelectionBar.vue'
  import type { Page } from '@/lib/admin/listView'

  /**
   * The frame every admin list shares: the toolbar, the selection bar, a card holding the
   * desktop table and the phone list, the empty line and the pager. Dialogs go in the default
   * slot.
   */
  defineProps<{
    shown: Page<unknown>
    total: number
    selected: number
    /** Shown when no row is left on the page */
    empty: string
  }>()
  defineEmits<{ clear: []; delete: [] }>()
  const page = defineModel<number>('page', { required: true })
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-4">
    <div class="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center">
      <slot name="toolbar" />
    </div>

    <SelectionBar
      :count="selected"
      @clear="$emit('clear')"
      @delete="$emit('delete')"
    />

    <div class="tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card">
      <slot name="table" />
      <slot name="list" />

      <p
        v-if="shown.rows.length === 0"
        class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
      >
        {{ empty }}
      </p>

      <Pager v-model="page" :shown="shown" :total="total" />
    </div>

    <slot />
  </div>
</template>
