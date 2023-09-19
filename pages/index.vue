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
    <CompanyCard
      :content="{
        logo: 'https://1000logos.net/wp-content/uploads/2021/05/Sony-logo.png',
        website: 'https://pro.sony/en_NO/home',
      }"
    />
    <CompanyGrid></CompanyGrid>
    <VBtn></VBtn>
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>
