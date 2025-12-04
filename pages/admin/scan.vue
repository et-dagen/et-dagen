<script setup lang="ts">
  import jsQR from 'jsqr'
  import CameraFeed from '~/components/camera/CameraFeed.vue'

  function cameraCallback(imageData: ImageData) {
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code) {
      console.log(code.data)
    } else {
      console.log('No code found')
    }
  }

  const callbackInterval = 200
</script>

<template>
  <CameraFeed
    :callback-function="cameraCallback"
    :callback-interval="callbackInterval"
  />
</template>
