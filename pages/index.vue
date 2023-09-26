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
    <CompanyHero
      :content="{
        name: 'Companyname',
        description: `This is the company's description`,
        logo: `https://graphicsfamily.com/wp-content/uploads/
2020/08/Company-Logo-Design-on-3d-glass-window-scaled.jpg`,
        website: 'https://shortsdag.no',
      }"
      class="my-5 d-flex justify-center"
    />
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>
