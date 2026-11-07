<script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { Toaster } from '@/components/ui/sonner'
  import { noticeStyle, snackbar } from '@/composables/useAlerts'

  const route = useRoute()
  const panel = computed(() => route.meta.layout === 'admin')
  watchEffect(() => (noticeStyle.value = panel.value ? 'toast' : 'snackbar'))

  const show = computed({
    get: () => snackbar.value !== null,
    set: (open) => {
      if (!open) snackbar.value = null
    },
  })
</script>

<template>
  <!-- in <body>, outside the layout -->
  <Teleport v-if="panel" to="body">
    <Toaster
      position="bottom-right"
      :close-button="true"
      :mobile-offset="{ bottom: '96px' }"
      :toast-options="{ duration: 5000 }"
    />
  </Teleport>
  <VSnackbar v-else v-model="show">
    {{ snackbar?.message }}
    <template #actions>
      <VBtn :color="snackbar?.type" variant="text" @click="show = false">
        {{ $t('alert.close_alert') }}
      </VBtn>
    </template>
  </VSnackbar>
</template>
