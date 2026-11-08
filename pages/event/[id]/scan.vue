<script setup lang="ts">
  import jsQR from 'jsqr'
  import CameraButton from '@/components/camera/CameraButton.vue'
  import CameraFeed, {
    type CameraFeedExposed,
  } from '@/components/camera/CameraFeed.vue'
  import {
    alertError,
    getErrorAlertContext,
    notify,
  } from '@/composables/useAlerts'

  definePageMeta({ area: 'scan' })

  const { t } = useI18n()
  const eventUid = String(useRoute().params.id)

  const { data } = await useFetch<Record<string, { title?: string }>>(
    '/api/v1/event',
    { query: { eventUID: eventUid } },
  )
  const eventTitle = computed(() => data.value?.[eventUid]?.title ?? '')

  const camera = ref<CameraFeedExposed | null>(null)
  const isCameraStarting = computed(() => camera.value?.isStarting ?? false)
  const isCameraRunning = computed(() => camera.value?.isRunning ?? false)
  // the last scan's outcome stays on screen after its notice is gone
  const outcome = ref<{ ok: boolean; text: string } | null>(null)

  async function markAttended(userUid: string) {
    try {
      await $fetch('/api/v1/event/attended', {
        method: 'PATCH',
        body: { eventUID: eventUid, userUID: userUid, attended: true },
      })
      outcome.value = { ok: true, text: t('event.scan.done') }
      notify(outcome.value.text, 'success')
    } catch (error) {
      outcome.value = { ok: false, text: getErrorAlertContext(error).message }
      alertError(error)
    }
  }

  function toggleCamera() {
    if (isCameraRunning.value) camera.value?.stop()
    else camera.value?.start()
  }

  // one code at a time: the camera stops on a find, and starts again on the next press
  function onCallbackFrame(image: ImageData) {
    const code = jsQR(image.data, image.width, image.height)
    if (!code?.data) return
    camera.value?.stop()
    markAttended(code.data)
  }

  // what the browser's error means for whoever holds the phone
  const cameraProblems: Record<string, string> = {
    NotAllowedError: 'event.scan.camera_denied',
    SecurityError: 'event.scan.camera_insecure',
    NotReadableError: 'event.scan.camera_busy',
    AbortError: 'event.scan.camera_busy',
  }

  function onError(error: Error) {
    notify(t(cameraProblems[error.name] ?? 'event.scan.camera_failed'), 'error')
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
        :aria-label="
          $t(isCameraRunning ? 'event.scan.stop' : 'event.scan.start')
        "
        @toggle="toggleCamera"
      />

      <p
        role="status"
        class="font-weight-bold text-center"
        :class="outcome?.ok ? 'text-success' : 'text-error'"
      >
        {{ outcome?.text }}
      </p>
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
