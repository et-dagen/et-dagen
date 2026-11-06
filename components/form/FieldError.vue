<script setup lang="ts">
  import { useFormField } from '@/components/ui/form/useFormField'

  // the contract's messages are keys under form.errors
  const { error, formMessageId } = useFormField()
</script>

<template>
  <p
    v-if="error"
    :id="formMessageId"
    data-slot="form-message"
    class="text-sm text-destructive"
  >
    {{ $t(`form.errors.${error}`) }}
  </p>
</template>
