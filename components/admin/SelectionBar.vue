<script setup lang="ts">
  import { Trash2, X } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  defineProps<{ count: number }>()
  defineEmits<{ clear: []; delete: [] }>()
</script>

<template>
  <div
    v-if="count > 0"
    class="flex items-center gap-3 rounded-md border border-signal/60 bg-signal/15 px-3 py-2 text-sm"
  >
    <span class="font-semibold">
      {{ $t('admin.list.selected', { n: count }) }}
    </span>
    <Button variant="ghost" size="sm" @click="$emit('clear')">
      <X aria-hidden="true" />
      {{ $t('admin.list.clear') }}
    </Button>
    <Button
      variant="destructive"
      size="sm"
      class="ml-auto"
      @click="$emit('delete')"
    >
      <Trash2 aria-hidden="true" />
      {{ $t('admin.list.delete') }}
    </Button>
  </div>
</template>
