<script setup lang="ts">
  import AdminNewEvent from '@/pages/admin/events/new.vue'

  definePageMeta({ layout: 'admin', protected: true, area: 'events' })
</script>

<template>
  <!-- the admin panel's page; the form lists only the user's companies and returns here -->
  <AdminNewEvent panel="/company/admin" />
</template>
