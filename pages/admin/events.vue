<script setup lang="ts">
  const { data } = await useFetch('/api/event')
  const { data: companies } = await useFetch('/api/company')

  // Add event id as property
  const events = computed(() => {
    return addEventIDAsProperty(data.value)
  })

  // Check if event has attendants
  const hasAttendants = computed(() => {
    return (event: any) => {
      return Object.hasOwn(event, 'attendants')
    }
  })

  // Send delete request to API
  const deleteEvent = (event: any) => {
    // TODO: Call on event API created in #111

    console.log(event)
  }
</script>
'
<template>
  <div class="container">
    <VCard v-for="(event, index) in events" :key="index" elevation="3">
      <!-- Event title -->
      <template #title>
        {{ event?.title }}
      </template>

      <template #text>
        <!-- UID -->
        <span class="card__text mb-2">
          <VIcon color="primary">mdi-fingerprint</VIcon>
          {{ event.id }}
        </span>

        <!-- Company -->
        <span class="card__text mb-2">
          <VIcon color="primary">mdi-domain</VIcon>
          <span v-if="companies[event.companyUID]">
            {{ companies[event.companyUID].name }}
          </span>
          <span class="text-primary">{{ event.companyUID }}</span>
        </span>

        <!-- Event location -->
        <span class="card__text mb-2">
          <VIcon color="primary">mdi-map-marker</VIcon>
          <span>
            {{ event.location.name }}
            <span v-if="event.location.map !== 'null'" class="text-primary"
              >(har link)</span
            >
          </span>
        </span>

        <!-- Event date -->
        <span class="card__text mb-2">
          <VIcon color="primary">mdi-calendar</VIcon>
          <span>
            {{ getNumericDayAndMonthString(event.date.start) }}
          </span>
          <span
            v-if="
              getDateFromDatetime(event.date.start) !==
              getDateFromDatetime(event.date.end)
            "
          >
            - {{ getNumericDayAndMonthString(event.date.end) }}
          </span>
        </span>

        <!-- Event start and end time -->
        <span class="card__text mb-2">
          <VIcon color="primary">mdi-clock</VIcon>
          <span>
            {{ getHourAndMinuteStringFromString(event.date.start) }} -
            {{ getHourAndMinuteStringFromString(event.date.end) }}
          </span>
        </span>

        <!-- Event capacity -->
        <span class="card__text mb-2">
          <VIcon color="primary">mdi-account</VIcon>

          <!-- Capacity count -->
          <span v-if="event.capacity !== 'null'">
            <span v-if="hasAttendants(event)">
              {{ Object.values(event.attendants).length }}
            </span>
            <span v-else>0</span>
            / {{ event.capacity }}
          </span>
          <span v-else>Ingen antallsbegrensning</span>
        </span>
      </template>

      <!-- Event actions -->
      <template #actions>
        <!-- Edit event button -->
        <VBtn
          variant="flat"
          @click.stop="() => navigateTo(`/admin/edit/event/${event.id}`)"
        >
          <VIcon>mdi-pencil</VIcon>
          Rediger
        </VBtn>

        <!-- Delete event button -->
        <VBtn
          variant="tonal"
          color="error"
          @click.stop="() => deleteEvent(event)"
        >
          <VIcon>mdi-delete</VIcon>
          Slett
        </VBtn>
      </template>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem !important;
  }
  .card {
    padding: 1rem !important;

    &__text {
      display: flex;
      flex-direction: row;
      align-items: center;
      $card-gap: 0.5rem;
      gap: $card-gap;

      .link,
      .link:visited {
        color: rgb(var(--v-theme-neutral));
      }
    }
  }
  .v-btn {
    width: calc(50% - 4px) !important;
  }
</style>
