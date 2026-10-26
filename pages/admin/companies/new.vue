<script setup lang="ts">
  import CompanyForm from '@/components/admin/form/CompanyForm.vue'
</script>

<template>
  <CompanyForm :initial="{ description: '', resumeAccess: false }" />
</template>
