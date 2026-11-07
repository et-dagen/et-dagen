<script setup lang="ts">
  import { Trash2, X } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  defineProps<{ count: number }>()
  defineEmits<{ clear: []; delete: [] }>()
</script>

<template>
  <div
    v-if="count > 0"
    class="tw:flex tw:items-center tw:gap-3 tw:rounded-md tw:border tw:border-signal/60 tw:bg-signal/15 tw:px-3 tw:py-2 tw:text-sm"
  >
    <span class="tw:font-semibold">
      {{ $t('admin.list.selected', { n: count }) }}
    </span>
    <Button variant="ghost" size="sm" @click="$emit('clear')">
      <X aria-hidden="true" />
      {{ $t('admin.list.clear') }}
    </Button>
    <Button
      variant="destructive"
      size="sm"
      class="tw:ml-auto"
      @click="$emit('delete')"
    >
      <Trash2 aria-hidden="true" />
      {{ $t('admin.list.delete') }}
    </Button>
  </div>
</template>
