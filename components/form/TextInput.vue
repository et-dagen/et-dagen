<script setup lang="ts">
  import { Input } from '@/components/ui/input'
  import OutlinedField from '@/components/form/OutlinedField.vue'

  export interface TextInputContent {
    label: string
    hint?: string
  }

  defineOptions({ inheritAttrs: false })
  defineProps<{ content: TextInputContent; errorMessages?: string[] }>()
  const model = defineModel<string | null>()
</script>

<template>
  <OutlinedField
    :label="content.label"
    :hint="content.hint"
    :error-messages="errorMessages"
    :filled="!!model"
  >
    <template #default="control">
      <Input
        v-bind="{ ...$attrs, ...control }"
        :model-value="model ?? ''"
        type="text"
        @update:model-value="model = String($event)"
      />
    </template>
  </OutlinedField>
</template>
