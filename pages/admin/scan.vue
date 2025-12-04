<template>
  <div class="qr-scanner">
    <CameraFeed
      ref="camera"
      :callback-interval="100"
      :width="400"
      :height="400"
      @callback-frame="onCallbackFrame"
      @error="onError"
    />

    <CameraButton
      :is-starting="isCameraStarting"
      :is-running="isCameraRunning"
      @toggle="toggleCamera"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import jsQR from 'jsqr'
  import type { CameraFeedExposed } from '~/components/camera/CameraFeed.vue'

  const camera = ref<CameraFeedExposed | null>(null)
  const isCameraStarting = computed(() => camera.value?.isStarting ?? false)
  const isCameraRunning = computed(() => camera.value?.isRunning ?? false)

  function toggleCamera() {
    if (!camera.value) return

    if (camera.value.isRunning) {
      camera.value.stop()
    } else {
      camera.value.start()
    }
  }

  function onCallbackFrame(imageData: ImageData) {
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      console.log('QR detected:', code.data)
    } else {
      console.log('No QR code found')
    }
  }

  function onError(err: any) {
    alert(`Camera error: ${err}`)
  }
</script>

<style scoped>
  .qr-scanner {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
