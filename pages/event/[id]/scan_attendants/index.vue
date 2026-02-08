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
      camera.value?.stop()
      markAttended(userUid)
    }
  }

  function onError(err: any) {
    alert(`Camera error: ${err}`)
  }
</script>

<template>
  <div class="page">
    <header class="header">
      <h2 class="event-title" :title="eventTitle">
        {{ eventTitle }}
      </h2>
    </header>

    <div class="scanner-section">
      <div class="scanner-card">
        <CameraFeed
          ref="camera"
          class="camera"
          :callback-interval="100"
          :width="400"
          :height="400"
          @callback-frame="onCallbackFrame"
          @error="onError"
        />
      </div>

      <CameraButton
        class="camera-button"
        :is-starting="isCameraStarting"
        :is-running="isCameraRunning"
        @toggle="toggleCamera"
      />
    </div>
  </div>
</template>

<style scoped>
  .page {
    padding: 1rem;
    padding-bottom: env(safe-area-inset-bottom);
    max-width: 480px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 0.75rem;
  }

  .event-title {
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.3;
    text-align: center;
    color: #111;

    word-break: break-word;
    overflow-wrap: anywhere;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .scanner-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .scanner-card {
    padding: 0.75rem;

    display: flex;
    justify-content: center;
  }

  .camera {
    width: 100%;
    max-width: 360px;
    aspect-ratio: 1 / 1;

    border-radius: 10px;
    overflow: hidden;
  }

  .camera-button {
    margin-top: 0.25rem;
  }

  @media (min-width: 768px) {
    .event-title {
      font-size: 1.15rem;
    }

    .scanner-card {
      padding: 1rem;
    }
  }
</style>
