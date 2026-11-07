<script setup lang="ts">
  import EditForm from '@/components/user/EditForm.vue'

  definePageMeta({
    // you edit your own profile, so you have to be signed in
    protected: true,
  })
</script>

<template>
  <VContainer>
    <EditForm />
  </VContainer>
</template>
