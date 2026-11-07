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
  <div class="tw:gap-2 tw:rounded-md tw:border tw:p-3">
    <label
      v-for="option in options"
      :key="option.value"
      class="tw:flex tw:items-center tw:gap-2 tw:text-sm"
    >
      <Checkbox
        :model-value="checked.includes(option.value)"
        @update:model-value="(on) => toggle(option.value, on)"
      />
      {{ option.label }}
    </label>
  </div>
</template>
