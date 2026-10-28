<script setup lang="ts">
  import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <!-- in <body>, where the admin theme's light or dark reaches it -->
  <Teleport to="body">
    <Toaster
      position="bottom-right"
      :close-button="true"
      :mobile-offset="{ bottom: '96px' }"
      :toast-options="{ duration: 5000 }"
    />
  </Teleport>
</template>
