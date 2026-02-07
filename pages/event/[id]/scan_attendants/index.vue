<script setup lang="ts">
  import { ref } from 'vue'
  import jsQR from 'jsqr'
  import type { CameraFeedExposed } from '~/components/camera/CameraFeed.vue'

  const route = useRoute()
  const eventUid = route.params.id as string

  // fetch event information from query
  const { data } = await useFetch('/api/event', {
    method: 'GET',
    query: {
      eventUID: eventUid,
    },
  })

  const event = computed(() => embedKeyIntoObjectValues(data.value)[0])
  console.log(event.value)

  const eventTitle = computed(() => event?.value?.title ?? '')

  const camera = ref<CameraFeedExposed | null>(null)
  const isCameraStarting = computed(() => camera.value?.isStarting ?? false)
  const isCameraRunning = computed(() => camera.value?.isRunning ?? false)

  const useAlert = useAlertStore()

  const markAttended = async (userUid: string) => {
    if (!userUid) return

    try {
      await $fetch('/api/event/attended', {
        method: 'PATCH',
        body: {
          eventUID: eventUid,
          userUID: userUid,
          attended: true,
        },
      })

      useAlert.alert('Attendance registered successfully', 'success')
    } catch (error: any) {
      const statusMessage = error?.statusMessage ?? ''

      if (statusMessage.includes('event/attended/user-not-attendant')) {
        useAlert.alert('This user is not registered for the event', 'warning')
      } else {
        useAlert.alert('Failed to register attendance', 'error')
      }
    }
  }

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
      const userUid = code.data
      console.log('QR detected:', userUid)
      camera.value?.stop()
      markAttended(userUid)
    } else {
      console.log('No QR code found')
    }
  }

  function onError(err: any) {
    alert(`Camera error: ${err}`)
  }
</script>

<template>
  <div class="qr-scanner">
    <h1 v-if="eventTitle" class="event-title">
      {{ eventTitle }}
    </h1>

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

<style scoped>
  .qr-scanner {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
