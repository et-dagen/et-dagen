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
          map: 'Johan sin adresse på google maps',
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
        eventUID: '-NifJRxs3FRhomJyoP_d',
      },
    })
  }

  const patchEvent = async () => {
    await $fetch('/api/event', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        companyUID: '-NesGFDmavw-y88kvfYM',
        eventUID: '-NifJRxs3FRhomJyoP_d',
        capacity: 420,
        date: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
        description: 'Johan døde på en komisk måte. Begravelse i stedet lmao',
        limitedCapacity: true,
        location: {
          map: 'Google maps link til kirken',
          name: 'Kirken',
        },
        title: 'Johan begravelse for the crew',
        eventType: 'other',
      }),
    })
  }
</script>

<template>
  <div>
    <VBtn color="success" @click="postEvent">Create event</VBtn>
    <VBtn color="error" @click="deleteEvent">Delete event</VBtn>
    <VBtn color="success" @click="patchEvent">Patch event</VBtn>
    <NuxtPage />
  </div>
</template>
