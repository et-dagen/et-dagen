<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    area: 'jobs',
  })
</script>

<template>
  <JobEditForm :job-uid="$route.params.id" />
</template>
