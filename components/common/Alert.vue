<script setup lang="ts">
  import { computed } from 'vue'
  import { Toaster } from '@/components/ui/sonner'

  const route = useRoute()
  // the panels' bottom bar covers the foot of a phone screen
  const panel = computed(() => route.meta.layout === 'admin')
</script>

<template>
  <!-- in <body>, outside the layout -->
  <Teleport to="body">
    <Toaster
      position="bottom-right"
      :close-button="true"
      :mobile-offset="panel ? { bottom: '96px' } : undefined"
      :toast-options="{ duration: 5000 }"
    />
  </Teleport>
</template>
