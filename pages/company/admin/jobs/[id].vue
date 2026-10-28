<script setup lang="ts">
  import AdminJob from '@/pages/admin/jobs/[id].vue'

  definePageMeta({ layout: 'admin', protected: true, area: 'jobs' })
</script>

<template>
  <!-- the admin panel's page; the form lists only the user's companies and returns here -->
  <AdminJob panel="/company/admin/jobs" />
</template>
