<script setup lang="ts">
  import { Minus } from '@lucide/vue'
  import { Checkbox } from '@/components/ui/checkbox'
  import type { CheckState } from '@/composables/admin/useSelection'

  defineProps<{ checked: CheckState; label: string }>()
  defineEmits<{ change: [on: CheckState] }>()
</script>

<template>
  <Checkbox
    :model-value="checked"
    :aria-label="label"
    @update:model-value="(on) => $emit('change', on)"
  >
    <Minus v-if="checked === 'indeterminate'" class="tw:size-3.5" />
  </Checkbox>
</template>
