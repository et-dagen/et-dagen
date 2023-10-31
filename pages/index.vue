<script setup lang="ts">
  const postEvent = async () => {
    await $fetch('/api/event', {
      method: 'post',
      body: {
        companyUID: '-NesGFDmavw-y88kvfYM',
        date: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
        description: "Lit party at Johan's place. Show up!",
        title: 'Johan hjemmefest for the crew',
        eventtype: 'other',
      },
      // companyUID, date, description, title, eventtype
    })
  }

  const deleteEvent = async () => {
    await $fetch('/api/event', {
      method: 'delete',
      body: {
        companyUID: '-NesGFDmavw-y88kvfYM',
        title: 'Johan hjemmefest for the crew',
        start: '2024-01-01T00:00:00Z',
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
    <CompanyHero
      :content="{
        name: 'Company Name',
        description: `Lorem ipsum 
        dolor sit amet, 
        consectetur adipiscing elit, sed do eiusmod tempor 
        incididunt ut labore et 
        dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
        ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure 
        dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat 
        nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
         qui officia deserunt mollit anim id est laborum.`,
        logo: `https://storage.googleapis.com/etdagen-d1f82.
appspot.com/storage_companies%2FSony%2FLogo%2Fsony.png`,
        website: 'https://shortsdag.no',
      }"
      class="my-5 d-flex justify-center"
    />
    <VBtn color="success" @click="postEvent">Create event</VBtn>
    <VBtn color="success" @click="deleteEvent">Delete event</VBtn>
  </div>
</template>
