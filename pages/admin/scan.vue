<template>
  <div>
    <button @click="toggleCamera">
      {{ camera?.isRunning ? 'Stop camera' : 'Start camera' }}
    </button>

    <CameraFeed
      ref="camera"
      :callback-interval="100"
      @callback-frame="onCallbackFrame"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import jsQR from 'jsqr'
  import type { CameraFeedExposed } from '~/components/camera/CameraFeed.vue'

  const camera = ref<CameraFeedExposed | null>(null)

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
