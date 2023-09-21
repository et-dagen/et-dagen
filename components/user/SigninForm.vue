<script setup lang="ts">
  import { useValidateEmail } from '@/composables/useForm'

  const initialState = {
    email: '',
    password: '',
  }

  const state = reactive({
    ...initialState,
  })

  // Only enable sign in button if all fields are filled out and valid
  const enableSignin = ref<boolean>(false)
  watch(state, async () => {
    const { valid } = await form.value.validate()
    enableSignin.value = !!state.email && !!state.password && !!valid
  })

  const form = ref()
  const submit = async () => {
    if (!form.value) return

    const { valid } = await form.value.validate()
    if (!valid) throw new Error('Form is not valid')

    if (!state.email || !state.password)
      throw new Error('Missing email or passord')

    await signinUser(state.email, state.password)
  }
</script>

<template>
  <VForm
    ref="form"
    @submit.prevent="submit"
    class="d-flex flex-column align-center"
  >
    <h3 class="mb-8">{{ $t('user.sign_in') }}</h3>
    <VContainer>
      <VRow class="py-1">
        <UserTextInput
          v-model="state.email"
          :content="{
            label: $t('user.login.email'),
          }"
          :rules="[useValidateEmail]"
        />
      </VRow>
      <VRow class="py-1">
        <UserTextInput
          v-model="state.password"
          :content="{
            label: $t('user.login.password'),
          }"
        />
      </VRow>
      <VBtn
        color="success"
        type="submit"
        class="mt-8 w-100"
        :disabled="!enableSignin"
      >
        {{ $t('user.sign_in') }}
      </VBtn>
    </VContainer>
  </VForm>
</template>
