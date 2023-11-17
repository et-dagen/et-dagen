<script setup lang="ts">
  export type SelectOption = string | number
  export interface SelectInputContent {
    label: string
    options: SelectOption[]
    required?: boolean
  }

  defineProps({
    content: { type: Object as PropType<SelectInputContent>, required: true },
  })
</script>

<template>
  <VSelect :label="content.label" :items="content.options" variant="outlined" />
</template>
