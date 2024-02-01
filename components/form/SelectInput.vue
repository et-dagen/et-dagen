<script setup lang="ts">
  export interface SelectInputContent {
    label: string
    options: any[]
    required?: boolean
  }

  defineProps({
    content: { type: Object as PropType<SelectInputContent>, required: true },
  })

  const sortedByTitle = (options: any[]) => {
    return options.sort((a: any, b: any) => {
      return a.title.localeCompare(b.title)
    })
  }
</script>

<template>
  <VSelect
    :label="content.label"
    :items="sortedByTitle(content.options)"
    variant="outlined"
  />
</template>
