<script setup lang="ts">
  import { Checkbox } from '@/components/ui/checkbox'

  defineProps<{ options: { value: string; label: string }[] }>()
  const checked = defineModel<string[]>({ default: () => [] })

  const toggle = (value: string, on: boolean | 'indeterminate') => {
    checked.value = on
      ? [...checked.value, value]
      : checked.value.filter((other) => other !== value)
  }
</script>

<template>
  <div class="gap-2 rounded-md border p-3">
    <label
      v-for="option in options"
      :key="option.value"
      class="flex items-center gap-2 text-sm"
    >
      <Checkbox
        :model-value="checked.includes(option.value)"
        @update:model-value="(on) => toggle(option.value, on)"
      />
      {{ option.label }}
    </label>
  </div>
</template>
