<template>
  <div>
    <VBtn color="success" @click="signIn">Sign in</VBtn>
    {{ user }}
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const signIn = () => signinUser('email', 'password')
</script>
