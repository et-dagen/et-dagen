<script setup lang="ts">
  export interface FileInputContent {
    label: string
    accept: string[]
    icon?: string
    hint?: string
    rules?: string[]
  }

  defineProps({
    content: { type: Object as PropType<FileInputContent>, required: true },
  })
</script>

<template>
  <VFileInput
    :label="content.label"
    :accept="content.accept.join()"
    variant="outlined"
    :hint="content.hint"
    :prepend-icon="content.icon"
  />
</template>
