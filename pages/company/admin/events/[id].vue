<script setup lang="ts">
  import AdminEvent from '@/pages/admin/events/[id]/index.vue'

  definePageMeta({ layout: 'admin', protected: true, area: 'events' })
</script>

<template>
  <!-- the admin panel's page; the form lists only the user's companies and returns here -->
  <AdminEvent panel="/company/admin" />
</template>
