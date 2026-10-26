<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    area: 'events',
  })
</script>

<template>
  <EventEditForm :event-uid="$route.params.id" />
</template>
