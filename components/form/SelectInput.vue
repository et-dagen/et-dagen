<script setup lang="ts">
  export interface SelectInputContent {
    label: string
    options: unknown[]
  }

  defineProps<{ content: SelectInputContent }>()
</script>

<template>
  <VSelect :label="content.label" :items="content.options" variant="outlined" />
</template>
