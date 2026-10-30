<script setup lang="ts">
  import EditJob from '@/components/admin/form/EditJob.vue'

  const uid = String(useRoute().params.id)
</script>

<template>
  <EditJob :uid="uid" />
</template>
