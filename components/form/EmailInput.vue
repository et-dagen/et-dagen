<script setup lang="ts">
  import { Input } from '@/components/ui/input'
  import OutlinedField from '@/components/form/OutlinedField.vue'

  defineOptions({ inheritAttrs: false })
  withDefaults(
    defineProps<{
      label?: string
      placeholder?: string
      hint?: string
      persistentHint?: boolean
      errorMessages?: string[]
    }>(),
    {
      label: undefined,
      placeholder: 'olakari@nordmann.no',
      hint: undefined,
      errorMessages: undefined,
    },
  )
  const model = defineModel<string | null>()
</script>

<template>
  <OutlinedField
    :label="label ?? $t('user.register.email')"
    :hint="hint"
    :persistent-hint="persistentHint"
    :error-messages="errorMessages"
    :filled="!!model"
  >
    <template #default="control">
      <Input
        v-bind="{ ...$attrs, ...control }"
        :model-value="model ?? ''"
        type="email"
        :placeholder="placeholder"
        :class="[
          control.class,
          'tw:placeholder:text-transparent tw:focus:placeholder:text-black/38',
        ]"
        @update:model-value="model = String($event)"
      />
    </template>
  </OutlinedField>
</template>
