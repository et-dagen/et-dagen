<script setup lang="ts">
  import JobForm from '@/components/admin/form/JobForm.vue'
</script>

<template>
  <JobForm
    :initial="{
      listing: 'text',
      deadlineType: 'date',
      applicationLink: '',
      description: '',
    }"
  />
</template>
