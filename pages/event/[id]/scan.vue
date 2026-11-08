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
  <div
    class="tw:mx-auto tw:max-w-[480px] tw:p-4 tw:pb-[env(safe-area-inset-bottom)]"
  >
    <header class="tw:mb-3">
      <h2
        class="tw:text-center tw:text-base tw:leading-snug tw:font-semibold tw:break-words tw:text-[#111] tw:[overflow-wrap:anywhere]"
        :title="eventTitle"
      >
        {{ eventTitle }}
      </h2>
    </header>

    <div class="tw:flex tw:flex-col tw:items-center tw:gap-3">
      <div class="tw:flex tw:justify-center tw:p-3 tw:md:p-4">
        <CameraFeed
          ref="camera"
          class="tw:aspect-square tw:w-full tw:max-w-[360px] tw:overflow-hidden tw:rounded-[10px]"
          :callback-interval="100"
          :width="400"
          :height="400"
          @callback-frame="onCallbackFrame"
          @error="onError"
        />
      </div>

      <CameraButton
        class="tw:mt-1"
        :is-starting="isCameraStarting"
        :is-running="isCameraRunning"
        :aria-label="
          $t(isCameraRunning ? 'event.scan.stop' : 'event.scan.start')
        "
        @toggle="toggleCamera"
      />

      <p
        role="status"
        class="tw:text-center tw:font-bold"
        :class="outcome?.ok ? 'tw:text-[#2BA84A]' : 'tw:text-[#cc3000]'"
      >
        {{ outcome?.text }}
      </p>
    </div>
  </div>
</template>
