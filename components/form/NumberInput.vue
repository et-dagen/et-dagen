<script setup lang="ts">
  export interface NumberInputContent {
    label: string
    hint?: string
    rules?: string[]
  }

  defineProps({
    content: { type: Object as PropType<NumberInputContent>, required: true },
  })
</script>

<template>
  <VTextField
    :label="content.label"
    type="number"
    variant="outlined"
    :hint="content.hint"
  />
</template>
