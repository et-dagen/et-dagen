<script setup lang="ts">
  import EditEvent from '@/components/admin/form/EditEvent.vue'

  definePageMeta({ layout: 'admin', protected: true, area: 'events' })

  const uid = String(useRoute().params.id)
</script>

<template>
  <!-- the admin panel's form; it lists only the user's companies and returns here -->
  <EditEvent :uid="uid" panel="/company/admin" />
</template>
