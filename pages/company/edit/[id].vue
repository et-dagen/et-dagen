<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    // route is only accessible by admins
    accessLevels: ['admin'],
  })
</script>

<template>
  <CompanyEditForm :company-uid="$route.params.id" />
</template>
