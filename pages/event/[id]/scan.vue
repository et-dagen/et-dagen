<script setup lang="ts">
  import { ArrowLeft, Camera, CameraOff } from '@lucide/vue'
  import jsQR from 'jsqr'
  import CameraFeed, {
    type CameraFeedExposed,
  } from '@/components/camera/CameraFeed.vue'
  import { Button } from '@/components/ui/button'
  import {
    alertError,
    getErrorAlertContext,
    notify,
  } from '@/composables/useAlerts'

  // `protected` until #712 lets the area alone guard a page
  definePageMeta({ protected: true, area: 'scan' })

  const { t } = useI18n()
  const localePath = useLocalePath()
  const eventUid = String(useRoute().params.id)

  const { data } = await useFetch<Record<string, { title?: string }>>(
    '/api/v1/event',
    { query: { eventUID: eventUid } },
  )
  const title = computed(() => data.value?.[eventUid]?.title ?? '')

  const camera = ref<CameraFeedExposed | null>(null)
  const starting = computed(() => camera.value?.isStarting ?? false)
  const running = computed(() => camera.value?.isRunning ?? false)
  // the last scan's outcome stays on screen after its toast is gone
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

  function toggle() {
    if (running.value) camera.value?.stop()
    else camera.value?.start()
  }

  // one code at a time: the camera stops on a find, and starts again on the next press
  function onFrame(image: ImageData) {
    const code = jsQR(image.data, image.width, image.height)
    if (!code?.data) return
    camera.value?.stop()
    markAttended(code.data)
  }

  function onCameraError(error: Error) {
    notify(
      t(
        error.name === 'NotAllowedError'
          ? 'event.scan.camera_denied'
          : 'event.scan.camera_failed',
      ),
      'error',
    )
  }
</script>

<template>
  <div
    class="tw:mx-auto tw:flex tw:max-w-md tw:flex-col tw:gap-5 tw:px-4 tw:py-6"
  >
    <NuxtLink
      :to="localePath(`/event/${eventUid}`)"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      <span class="tw:line-clamp-1">{{ title }}</span>
    </NuxtLink>

    <div class="tw:flex tw:flex-col tw:gap-2">
      <h1 class="tw:text-2xl tw:font-extrabold tw:tracking-tight">
        {{ $t('event.scan.title') }}
      </h1>
      <p class="tw:text-muted-foreground">{{ $t('event.scan.lead') }}</p>
    </div>

    <div
      class="tw:relative tw:aspect-square tw:w-full tw:overflow-hidden tw:rounded-lg tw:bg-foreground"
    >
      <CameraFeed
        ref="camera"
        class="tw:size-full tw:[&_canvas]:size-full tw:[&_canvas]:object-cover"
        :callback-interval="100"
        :width="400"
        :height="400"
        @callback-frame="onFrame"
        @error="onCameraError"
      />
      <!-- dims the last frame, which stays on the canvas once the camera stops -->
      <p
        v-if="!running"
        class="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:bg-foreground/75 tw:text-background"
      >
        <CameraOff class="tw:size-5" aria-hidden="true" />
        {{ $t(starting ? 'event.scan.starting' : 'event.scan.off') }}
      </p>
    </div>

    <Button size="lg" class="tw:h-11" :disabled="starting" @click="toggle">
      <component :is="running ? CameraOff : Camera" aria-hidden="true" />
      {{ $t(running ? 'event.scan.stop' : 'event.scan.start') }}
    </Button>

    <p
      role="status"
      class="tw:min-h-6 tw:text-center tw:font-semibold"
      :class="outcome?.ok ? 'tw:text-plate' : 'tw:text-destructive'"
    >
      {{ outcome?.text }}
    </p>
  </div>
</template>
