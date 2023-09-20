<template>
  <div>
    <HomeBanner
      :content="{
        caption: 'Få et innblikk i din fremtidige arbeidsplass',
        date: { start: '2023-02-14', end: '2023-02-15' },
        image: 'https://cdn.vuetifyjs.com/images/parallax/material.jpg',
        title: 'Elektronikk & Teknologidagen',
      }"
    />

    <VBtn color="success" @click="createCompany">createCompany</VBtn>
    <VBtn color="success" @click="udpateCompany">udpateCompany</VBtn>
    <VBtn color="error" @click="deleteCompany">deleteCompany</VBtn>

    {{ companies }}
  </div>
</template>

<script setup lang="ts">
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
