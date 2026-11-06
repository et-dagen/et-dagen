<script setup lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import type { Page } from '@/lib/admin/listView'

  defineProps<{ shown: Omit<Page<unknown>, 'rows'>; total: number }>()
  const page = defineModel<number>({ required: true })
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground"
  >
    <span aria-live="polite">
      {{ $t('admin.list.showing', { from: shown.from, to: shown.to, total }) }}
    </span>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        :disabled="shown.page <= 1"
        :aria-label="$t('admin.list.previous')"
        @click="page = shown.page - 1"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span class="text-foreground tabular-nums">
        {{ shown.page }} / {{ shown.pages }}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        :disabled="shown.page >= shown.pages"
        :aria-label="$t('admin.list.next')"
        @click="page = shown.page + 1"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  </div>
</template>
