<script setup lang="ts">
  defineProps({
    confirmPassword: Boolean,
    clearable: Boolean,
  })

  const ShowPassord = ref(false)
</script>

<template>
  <VTextField
    variant="outlined"
    :clearable="clearable"
    :append-inner-icon="ShowPassord ? 'mdi-eye' : 'mdi-eye-off'"
    :type="ShowPassord ? 'text' : 'password'"
    :label="
      confirmPassword
        ? $t('user.register.password_confirmation')
        : $t('user.register.password')
    "
    @click:append-inner="ShowPassord = !ShowPassord"
  />
</template>
