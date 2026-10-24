<script setup lang="ts">
  import JobForm from '@/components/admin/form/JobForm.vue'
</script>

<template>
  <JobForm :initial="{ applicationLink: '', description: '' }" />
</template>
