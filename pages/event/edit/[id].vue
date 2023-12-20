<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    // route is only accessible by admins
    accessLevels: ['admin', 'company'],
  })

  // const route = useRoute()
  // const { data } = await useFetch('/api/event', {
  //   query: { eventUID: route.params.id },
  // })

  // if (!data.value) navigateTo('/event/edit')

  // const event = computed(() =>
  //   data.value
  //     ? Object.entries(embedKeyIntoObjectValues(data.value))[0][1]
  //     : undefined
  // )
</script>

<template>
  <EventEditForm :event-uid="$route.params.id" />
</template>
