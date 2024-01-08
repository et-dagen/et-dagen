<script setup lang="ts">
  const eventUid = useRoute().params.id

  // Fetch event information from query
  const { data: event } = await useFetch('/api/event', {
    method: 'GET',
    query: {
      eventUID: eventUid,
    },
  })

  console.log('DATA:')
  // console.log(event[eventUid])
</script>

<template>
  <div>
    <div>
      <!-- <div>{{ event[eventUid] }}</div> -->
      <h2 class="text-center text-h3 pt-5">{{ event[eventUid]['title'] }}</h2>
      <div>Company: {{ event[eventUid]['companyUID'] }}</div>
      <div>Description: {{ event[eventUid]['description'] }}</div>
      <div>Capacity: {{ event[eventUid]['capacity'] }}</div>
      <div>Date: {{ event[eventUid]['date'] }}</div>
      <div>Location: {{ event[eventUid]['location'] }}</div>
      <div>Attendants: {{ event[eventUid]['attendants'] }}</div>
    </div>
    <VCard style="max-width: 80vw">
      <VRow>
        <VCol cols="4">
          <VCard>
            <h4>Detaljer</h4>
            <p>Fra:</p>
            <p>Til:</p>
            <p>Sted:</p>
            <p>Hva:</p>
            <p>Arrangør:</p>
          </VCard>
        </VCol>
        <VCol cols="8"> hei </VCol>
      </VRow>
    </VCard>
  </div>
</template>
