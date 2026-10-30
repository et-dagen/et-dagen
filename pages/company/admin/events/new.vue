<script setup lang="ts">
  import EventForm from '@/components/admin/form/EventForm.vue'
  import { NEW_EVENT } from '@/lib/admin/eventForm'

  definePageMeta({ layout: 'admin', protected: true, area: 'events' })
</script>

<template>
  <!-- the admin panel's form; it lists only the user's companies and returns here -->
  <EventForm :initial="NEW_EVENT" panel="/company/admin" />
</template>
