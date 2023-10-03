<template>
  <VTextField
    placeholder="olakari@nordmann.no"
    type="email"
    :rules="[rules.email]"
    variant="outlined"
  />
</template>

<script setup lang="ts">
  const rules = {
    email: (value: string) => {
      // prettier-ignore-start
      const pattern =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      // prettier-ignore-end
      return pattern.test(value) || 'user.invalid_email'
    },
  }
</script>
