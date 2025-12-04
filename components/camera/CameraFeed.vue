<template>
  <div>
    <button @click="start">Start camera</button>
    <video ref="video" autoplay playsinline muted style="display: none"></video>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onBeforeUnmount } from 'vue'

  type CallbackFunction = (_imageData: ImageData) => void

  const props = defineProps<{
    callbackFunction?: CallbackFunction
    callbackInterval?: number
  }>()

  const video = ref<HTMLVideoElement | null>(null)
  const canvas = ref<HTMLCanvasElement | null>(null)
  let stream: MediaStream | null = null
  let width = 0
  let height = 0

  const start = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    })

    video.value!.srcObject = stream
    await video.value!.play()

    width = video.value!.videoWidth
    height = video.value!.videoHeight
    canvas.value!.width = width
    canvas.value!.height = height

    runCallbackLoop()
  }

  const runCallbackLoop = () => {
    const ctx = canvas.value!.getContext('2d')!
    let last = 0
    const interval = props.callbackInterval ? props.callbackInterval : 0

    const loop = (time: number) => {
      ctx.drawImage(video.value!, 0, 0, width, height)

      if (props.callbackFunction) {
        if (time - last > interval) {
          const imageData = ctx.getImageData(0, 0, width, height)
          props.callbackFunction(imageData)

          last = time
        }
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }

  onBeforeUnmount(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop())
  })
</script>
