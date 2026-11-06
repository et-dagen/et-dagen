<script setup lang="ts">
  import EditEvent from '@/components/admin/form/EditEvent.vue'

  const uid = String(useRoute().params.id)
</script>

<template>
  <EditEvent :uid="uid" />
</template>
