<script setup lang="ts">
  import EventForm from '@/components/admin/form/EventForm.vue'
  import { NEW_EVENT } from '@/lib/admin/eventForm'
</script>

<template>
  <EventForm :initial="NEW_EVENT" />
</template>
