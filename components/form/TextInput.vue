<script setup lang="ts">
  export interface TextInputContent {
    label: string
    hint?: string
  }

  defineProps<{ content: TextInputContent }>()
</script>

<template>
  <VTextField
    :label="content.label"
    type="text"
    variant="outlined"
    :hint="content.hint"
  />
</template>
