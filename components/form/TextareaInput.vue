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
  <VTextarea
    :label="content.label"
    type="text"
    variant="outlined"
    :hint="content.hint"
  />
</template>
