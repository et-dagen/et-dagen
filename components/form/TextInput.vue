<script setup lang="ts">
  export interface TextInputContent {
    label: string
    hint?: string
    rules?: string[]
  }

  defineProps({
    content: { type: Object as PropType<TextInputContent>, required: true },
  })
</script>

<template>
  <VTextField
    :label="content.label"
    type="text"
    variant="outlined"
    :hint="content.hint"
  />
</template>
