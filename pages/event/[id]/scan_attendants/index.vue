<script setup lang="ts">
  import { ref } from 'vue'
  import jsQR from 'jsqr'
  import type { CameraFeedExposed } from '~/components/camera/CameraFeed.vue'

  const route = useRoute()
  const eventUid = route.params.id as string
  const { t } = useI18n()

  // fetch event information from query
  const { data } = await useFetch('/api/v1/event', {
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
      await $fetch('/api/v1/event/attended', {
        method: 'PATCH',
        body: {
          eventUID: eventUid,
          userUID: userUid,
          attended: true,
        },
      })

      useAlert.alert(t('admin.attendees.scanner.registered'), 'success')
    } catch (error: any) {
      const statusMessage = error?.statusMessage ?? ''

      if (statusMessage.includes('event/attended/user-not-attendant')) {
        useAlert.alert(t('admin.attendees.scanner.not_attendant'), 'warning')
      } else {
        useAlert.alert(t('admin.attendees.scanner.failed'), 'error')
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
    useAlert.alert(
      t('admin.attendees.scanner.camera_error', { error: String(err) }),
      'error',
    )
  }
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-md tw:flex-col tw:items-center tw:gap-4 tw:px-4 tw:pt-8 tw:pb-[max(2rem,env(safe-area-inset-bottom))] tw:lg:py-12"
    >
      <div class="tw:flex tw:flex-col tw:items-center tw:gap-1 tw:text-center">
        <p class="tw:text-sm tw:font-bold tw:text-brand">
          {{ $t('admin.attendees.scan') }}
        </p>
        <h1
          class="tw:line-clamp-3 tw:text-2xl tw:font-bold tw:text-balance tw:[overflow-wrap:anywhere]"
          :title="eventTitle"
        >
          {{ eventTitle }}
        </h1>
      </div>

      <CameraFeed
        ref="camera"
        class="tw:aspect-square tw:w-full tw:max-w-[360px] tw:overflow-hidden tw:rounded-lg tw:bg-plate tw:[&_canvas]:size-full tw:[&_canvas]:object-cover"
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
  </div>
</template>
