<script setup lang="ts">
  export interface TextInputContent {
    label: string
    hint?: string
    rules?: string[]
  }

  defineProps({
    content: { type: Object as PropType<TextInputContent>, required: true },
  })

  const emit = defineEmits(['input'])
  const inputValue = ref<string>()
</script>

<template>
  <v-text-field
    :label="content.label"
    type="text"
    variant="outlined"
    :hint="content.hint"
    v-model="inputValue"
    @input="() => emit('input', inputValue)"
  />
</template>
