<script setup lang="ts">
  import AdminNewJob from '@/pages/admin/jobs/new.vue'

  definePageMeta({ layout: 'admin', protected: true, area: 'jobs' })
</script>

<template>
  <!-- the admin panel's page; the form lists only the user's companies and returns here -->
  <AdminNewJob panel="/company/admin/jobs" />
</template>
