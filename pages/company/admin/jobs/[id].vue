<script setup lang="ts">
  import EditJob from '@/components/admin/form/EditJob.vue'

  definePageMeta({ layout: 'admin', protected: true, area: 'jobs' })

  const uid = String(useRoute().params.id)
</script>

<template>
  <!-- the admin panel's form; it lists only the user's companies and returns here -->
  <EditJob :uid="uid" panel="/company/admin/jobs" />
</template>
