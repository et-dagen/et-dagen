<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    area: 'admin',
  })
</script>

<template>
  <CompanyEditForm :company-uid="$route.params.id" />
</template>
