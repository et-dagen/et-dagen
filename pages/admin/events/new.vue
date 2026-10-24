<script setup lang="ts">
  import EventForm from '@/components/admin/form/EventForm.vue'
</script>

<template>
  <EventForm
    :initial="{
      signup: false,
      description: '',
      location: { name: '', map: '' },
      programmes: [],
      years: [],
    }"
  />
</template>
