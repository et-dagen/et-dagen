<script setup lang="ts">
  const alertStore = useAlertStore()
  const { show, type, message } = storeToRefs(alertStore)
</script>
<template>
  <VSnackbar v-model="show">
    {{ message }}
    <template #actions>
      <VBtn :color="type" variant="text" @click="alertStore.clear()">
        {{ $t('alert.close_alert') }}
      </VBtn>
    </template>
  </VSnackbar>
</template>
