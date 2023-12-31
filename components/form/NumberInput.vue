<script setup lang="ts">
  export interface TextareaInputContent {
    label: string
    hint?: string
    rules?: string[]
  }

  defineProps({
    content: { type: Object as PropType<TextareaInputContent>, required: true },
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
