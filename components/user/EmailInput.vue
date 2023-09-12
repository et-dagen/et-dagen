<template>
  <div>
    <v-text-field
      placeholder="ola@nordmann.no"
      type="email"
      :rules="[rules.required, rules.email]"
      :v-bind="emailInput"
      variant="outlined"
      @update:model-value="emailInput"
    />
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  let emailInput: string
  const rules = {
    required: (value: string) => !!value || t('user.required_input'),
    email: (value: string) => {
      // prettier-ignore-start
      const pattern =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      // prettier-ignore-end
      return pattern.test(value) || t('user.invalid_email')
    },
  }
</script>
