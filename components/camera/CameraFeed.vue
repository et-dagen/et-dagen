<template>
  <div>
    <video ref="video" autoplay playsinline muted style="display: none"></video>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onBeforeUnmount } from 'vue'

  type CameraFeedEmits = {
    (event: 'error', err: Error): void
    (event: 'callbackFrame', image: ImageData): void
  }

  const emit = defineEmits<CameraFeedEmits>()

  const props = defineProps<{
    callbackInterval?: number
  }>()

  const video = ref<HTMLVideoElement | null>(null)
  const canvas = ref<HTMLCanvasElement | null>(null)
  let stream: MediaStream | null = null
  const animationFrameId: number | null = null
  let width = 0
  let height = 0

  const isRunning = ref(false)
  const isStarting = ref(false)

  async function start() {
    if (isRunning.value || isStarting.value) {
      console.warn('Camera has already been started')
      return
    }
    isStarting.value = true
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
    } catch (err: any) {
      isStarting.value = false
      if (err.name === 'NotAllowedError') {
        emit('error', err)
      }
      return
    }

    video.value!.srcObject = stream
    await video.value!.play()

    width = video.value!.videoWidth
    height = video.value!.videoHeight
    canvas.value!.width = width
    canvas.value!.height = height

    isStarting.value = false
    isRunning.value = true

    runFrameLoop()
  }

  function stop() {
    if (stream) stream.getTracks().forEach((t) => t.stop())
    if (animationFrameId != null) cancelAnimationFrame(animationFrameId)

    isStarting.value = false
    isRunning.value = false
  }

  defineExpose({
    start,
    stop,
    isStarting,
    isRunning,
  })

  export type CameraFeedExposed = {
    start: () => void
    stop: () => void
    isRunning: Ref<boolean>
    isStarting: Ref<boolean>
  }

  const runFrameLoop = () => {
    const ctx = canvas.value!.getContext('2d')!
    let last = 0
    const interval = props.callbackInterval ? props.callbackInterval : 0

    const loop = (time: number) => {
      if (!isRunning.value) return
      ctx.drawImage(video.value!, 0, 0, width, height)

      if (time - last > interval) {
        const imageData = ctx.getImageData(0, 0, width, height)
        emit('callbackFrame', imageData)
        last = time
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }

  onBeforeUnmount(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop())
  })
</script>
