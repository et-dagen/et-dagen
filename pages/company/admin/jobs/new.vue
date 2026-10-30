<script setup lang="ts">
  import JobForm from '@/components/admin/form/JobForm.vue'
  import { NEW_JOB } from '@/lib/admin/jobForm'

  definePageMeta({ layout: 'admin', protected: true, area: 'jobs' })
</script>

<template>
  <!-- the admin panel's form; it lists only the user's companies and returns here -->
  <JobForm :initial="NEW_JOB" panel="/company/admin/jobs" />
</template>
