<template>
  <div>
    <p>User from store: {{ user }}</p>

    <HomeBanner
      :content="{
        caption: 'Få et innblikk i din fremtidige arbeidsplass',
        date: { start: '2023-02-14', end: '2023-02-15' },
        image: 'https://cdn.vuetifyjs.com/images/parallax/material.jpg',
        title: 'Elektronikk & Teknologidagen',
      }"
    />

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
