<script setup lang="ts">
  defineProps<{ confirmPassword?: boolean }>()

  const shown = ref(false)
</script>

<template>
  <VTextField
    variant="outlined"
    :append-inner-icon="shown ? 'mdi-eye' : 'mdi-eye-off'"
    :type="shown ? 'text' : 'password'"
    :label="
      confirmPassword
        ? $t('user.register.password_confirmation')
        : $t('user.register.password')
    "
    @click:append-inner="shown = !shown"
  />
</template>
