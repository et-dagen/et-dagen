<script setup lang="ts">
  import JobForm from '@/components/admin/form/JobForm.vue'
  import { NEW_JOB } from '@/lib/admin/jobForm'
</script>

<template>
  <JobForm :initial="NEW_JOB" />
</template>
