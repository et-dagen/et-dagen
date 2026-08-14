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
    width?: number
    height?: number
  }>()

  const video = ref<HTMLVideoElement | null>(null)
  const canvas = ref<HTMLCanvasElement | null>(null)
  let stream: MediaStream | null = null
  const animationFrameId: number | null = null
  let videoWidth = 0
  let videoHeight = 0

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
        video: {
          facingMode: { ideal: 'environment' },
          width: props.width ? { ideal: props.width } : undefined,
          height: props.height ? { ideal: props.height } : undefined,
        },
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

    videoWidth = video.value!.videoWidth
    videoHeight = video.value!.videoHeight
    canvas.value!.width = videoWidth
    canvas.value!.height = videoHeight

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
      ctx.drawImage(video.value!, 0, 0, videoWidth, videoHeight)

      if (time - last > interval) {
        const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight)
        emit('callbackFrame', imageData)
        last = time
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }

  onMounted(() => {
    if (canvas.value && props.width && props.height) {
      canvas.value.width = props.width
      canvas.value.height = props.height

      const ctx = canvas.value.getContext('2d')!
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, props.width, props.height)
    }
  })

  onBeforeUnmount(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop())
  })
</script>
