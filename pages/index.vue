<script setup lang="ts">
  const createCode = async () => {
    await $fetch('/api/code', {
      method: 'POST',
      query: {
        companyUID: '-NesGFDmavw-y88kvfYM',
      },
    })
  }

  const code = 'company-of-things-utcUHFsp'

  const checkCode = async () => {
    await $fetch(`/api/code/${code}`)
  }

  const deleteCode = async () => {
    await $fetch(`/api/code`, {
      method: 'DELETE',
      body: {
        code,
      },
    })
  }
</script>

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

    <VBtn color="success" @click="createCode">Create Code</VBtn>
    <VBtn color="success" @click="checkCode">Check Code</VBtn>
    <VBtn color="error" @click="deleteCode">Delete Code</VBtn>
  </div>
</template>
