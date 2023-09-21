<template>
  <VResponsive max-width="400">
    <VTextField
      variant="outlined"
      clearable
      :rules="[rules.required, rules.min]"
      :append-inner-icon="ShowPassord ? 'mdi-eye' : 'mdi-eye-off'"
      :type="ShowPassord ? 'text' : 'password'"
      :label="confirmPassword ? 'Bekreft passord' : 'Passord'"
      @click:append-inner="ShowPassord = !ShowPassord"
    />
  </VResponsive>
</template>

<script setup lang="ts">
  defineProps({
    confirmPassword: Boolean,
  })
  const ShowPassord = ref(false)

  const rules = {
    required: (value: string) => !!value || 'Feltet er påkrevd',
    min: (value: string) => value.length >= 8 || 'Passordet må ha minst 8 tegn',
  }
</script>
