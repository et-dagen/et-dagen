<template>
  <div>
    <p>User from store: {{ user }}</p>

    <VBtn
      color="info"
      @click="
        registerUser({
          email: 'petter@cot.as',
          password: '123456',
          name: 'Petter Arnt',
          studyProgram: 'kyb',
        })
      "
      >Create user</VBtn
    >
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>
