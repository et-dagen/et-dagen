<template>
  <div>
    <!-- Sign in/out buttons -->
    <VBtn v-if="!authStore.isLoggedIn" color="success" @click="signIn"
      >Sign in</VBtn
    >
    <VBtn v-else color="error" @click="signOut">Sign out</VBtn>
    {{ user }}
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const signIn = () => signinUser('email', 'password')
  const signOut = () => signoutUser()
</script>
