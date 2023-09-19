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

    <VBtn color="success" @click="createCompany">createCompany</VBtn>
    <VBtn color="success" @click="udpateCompany">udpateCompany</VBtn>
    <VBtn color="error" @click="deleteCompany">deleteCompany</VBtn>

    {{ companies }}
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const { data: companies } = await useFetch(`/api/company`)

  const createCompany = async () => {
    await $fetch('/api/company', {
      method: 'POST',
      body: {
        name: 'Company of Things',
        webpage: 'cot.no',
        type: 'partner',
      },
    })
  }

  const udpateCompany = async () => {
    await $fetch('/api/company', {
      method: 'PUT',
      body: {
        name: 'Company of Things',
        companyUID: '-NehfYyZOHF6-6aYVcx8',
      },
    })
  }

  const deleteCompany = async () => {
    await $fetch('/api/company', {
      method: 'DELETE',
      body: {
        companyUID: '-NehfYyZOHF6-6aYVcx8',
      },
    })
  }
</script>
