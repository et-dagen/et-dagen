<script setup lang="ts">
  import { useRequiredInput, useValidatePassword } from '@/composables/useForm'
  defineProps({
    confirmPassword: Boolean,
  })
  const ShowPassord = ref(false)
</script>

<template>
  <VResponsive max-width="400">
    <VTextField
      variant="outlined"
      clearable
      :rules="[useRequiredInput, useValidatePassword]"
      :append-inner-icon="ShowPassord ? 'mdi-eye' : 'mdi-eye-off'"
      :type="ShowPassord ? 'text' : 'password'"
      :label="
        confirmPassword
          ? $t('user.register.password_confirmation')
          : $t('user.register.password')
      "
      @click:append-inner="ShowPassord = !ShowPassord"
    />
  </VResponsive>
</template>
