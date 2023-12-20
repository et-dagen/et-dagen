<script setup lang="ts">
  const props = defineProps({
    eventUid: {
      type: String,
      required: false,
      default: null,
    },
  })

  const { data: companies } = await useFetch('/api/company')
  // TODO: Replace with API endpoint for getting only a sublist of known UIDs
  const { data: users } = await useFetch('/api/user', {
    query: { scope: 'all' },
  })

  console.log('companies:', companies.value)
  console.log('users:', users.value)

  const { data: event } = await useAsyncData('event', async () => {
    if (!props.eventUid) return

    const data = await $fetch('/api/event', {
      query: { eventUID: props.eventUid },
    })

    return data
  })

  // Reroute to /event/edit if event does not exist
  if (props.eventUid && !event.value) navigateTo('/event/edit')
</script>

<template>
  <h3>Test</h3>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

  .title {
    text-align: center;
  }

  .v-container {
    max-width: 50rem !important;
  }

  .v-row {
    padding-block: 0.6rem;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .v-window__container {
    div {
      padding-block: 0.6rem;
    }
  }

  .btn--submit {
    width: 60%;
    margin-inline: 20% !important;
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .v-tab {
      font-size: 1rem;
    }

    .btn--submit {
      width: 100%;
      margin: 0 !important;
    }
  }
</style>
