<script setup lang="ts">
  export interface SelectInputContent {
    label: string
    options: any[]
    required?: boolean
  }

  defineProps({
    content: { type: Object as PropType<SelectInputContent>, required: true },
  })
</script>

<template>
  <VSelect :label="content.label" :items="content.options" variant="outlined" />
</template>
