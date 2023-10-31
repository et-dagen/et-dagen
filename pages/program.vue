<script setup lang="ts">
  const postEvent = async () => {
    await $fetch('/api/event', {
      method: 'post',
      body: {
        companyUID: '-NesGFDmavw-y88kvfYM',
        capacity: 69,
        date: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
        description: "Lit party at Johan's place. Show up!",
        limitedCapacity: true,
        location: {
          map: null,
          name: 'Hjemme hos Johan',
        },
        title: 'Johan hjemmefest for the crew',
        eventType: 'other',
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
        starttime: '2024-01-01T00:00:00Z',
      },
    })
  }

  const patchEvent = async () => {
    await $fetch('/api/event', {
      mathod: 'patch',
      body: {
        companyUID: '-NesGFDmavw-y88kvfYM',
      },
    })
  }
</script>

<template>
  <div>
    <NuxtPage />
    <VBtn color="success" @click="postEvent">Create event</VBtn>
    <VBtn color="error" @click="deleteEvent">Delete event</VBtn>
    <VBtn color="success" @click="patchEvent">Patch event</VBtn>
  </div>
</template>
