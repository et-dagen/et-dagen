<template>
  <v-responsive max-width="400">
    <VTextField
      clearable
      :rules="[rules.required, rules.min]"
      :append-inner-icon="ShowPassord ? 'mdi-eye' : 'mdi-eye-off'"
      :type="ShowPassord ? 'text' : 'password'"
      :label="confirmPassword ? 'Bekreft passord' : 'Passord'"
      @click:append-inner="ShowPassord = !ShowPassord"
    />
  </v-responsive>
</template>

<script setup lang="ts">
  const props = defineProps({
    confirmPassword: Boolean,
  })
  const ShowPassord = ref(false)

  const rules = {
    required: (value) => !!value || 'Feltet er påkrevd',
    min: (v) => v.length >= 8 || 'Passordet må ha minst 8 tegn',
  }
  console.log(props.confirmPassword)
</script>
