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
  <div class="pt-10 d-flex justify-center">
    <!-- <div> -->
    <!-- <div>{{ event[eventUid] }}</div> -->
    <!-- <h2 class="text-center text-h3 pt-5">{{ event[eventUid]['title'] }}</h2>
    <div>Company: {{ event[eventUid]['companyUID'] }}</div>
    <div>Description: {{ event[eventUid]['description'] }}</div>
    <div>Capacity: {{ event[eventUid]['capacity'] }}</div>
    <div>Date: {{ event[eventUid]['date'] }}</div>
    <div>Location: {{ event[eventUid]['location'] }}</div>
    <div>Attendants: {{ event[eventUid]['attendants'] }}</div> -->
    <!-- </div> -->
    <VCard variant="flat" class="pt-10 pa-1">
      <VRow>
        <VCol cols="4">
          <VCard>
            <div class="ma-2">
              <h4 class="text-h5 pb-4 font-weight-bold">Detaljer</h4>
              <p>
                <span class="font-weight-bold">Fra:</span>
                {{ event[eventUid]['date']['start'] }}
              </p>
              <p>
                <span class="font-weight-bold">Til: </span>
                {{ event[eventUid]['date']['end'] }}
              </p>
              <p>
                <span class="font-weight-bold">Sted: </span>
                {{ event[eventUid]['location']['name'] }}
              </p>
              <p>
                <span class="font-weight-bold">Hva: </span>
                {{ event[eventUid]['eventType'] }}
              </p>
              <p>
                <span class="font-weight-bold">Arrangør: </span>
                {{ event[eventUid]['companyUID'] }}
              </p>
            </div>
          </VCard>
        </VCol>
        <VCol cols="8">
          <VCard>
            <div class="ma-2">
              <h3 class="text-h4 pb-6">
                {{ event[eventUid]['title'] }}
              </h3>
              <p>{{ event[eventUid]['description'] }}</p>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>
