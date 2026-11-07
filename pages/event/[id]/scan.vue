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

  definePageMeta({ area: 'scan' })

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

  // what the browser's error means for whoever holds the phone
  const cameraProblems: Record<string, string> = {
    NotAllowedError: 'event.scan.camera_denied',
    SecurityError: 'event.scan.camera_insecure',
    NotReadableError: 'event.scan.camera_busy',
    AbortError: 'event.scan.camera_busy',
  }

  function onCameraError(error: Error) {
    notify(t(cameraProblems[error.name] ?? 'event.scan.camera_failed'), 'error')
  }
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
    <NuxtLink
      :to="localePath(`/event/${eventUid}`)"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      <span class="line-clamp-1">{{ title }}</span>
    </NuxtLink>

    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-extrabold tracking-tight">
        {{ $t('event.scan.title') }}
      </h1>
      <p class="text-muted-foreground">{{ $t('event.scan.lead') }}</p>
    </div>

    <div
      class="relative aspect-square w-full overflow-hidden rounded-lg bg-foreground"
    >
      <CameraFeed
        ref="camera"
        class="size-full [&_canvas]:size-full [&_canvas]:object-cover"
        :callback-interval="100"
        :width="400"
        :height="400"
        @callback-frame="onFrame"
        @error="onCameraError"
      />
      <!-- dims the last frame, which stays on the canvas once the camera stops -->
      <p
        v-if="!running"
        class="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/75 text-background"
      >
        <CameraOff class="size-5" aria-hidden="true" />
        {{ $t(starting ? 'event.scan.starting' : 'event.scan.off') }}
      </p>
    </div>

    <Button size="lg" class="h-11" :disabled="starting" @click="toggle">
      <component :is="running ? CameraOff : Camera" aria-hidden="true" />
      {{ $t(running ? 'event.scan.stop' : 'event.scan.start') }}
    </Button>

    <p
      role="status"
      class="min-h-6 text-center font-semibold"
      :class="outcome?.ok ? 'text-plate' : 'text-destructive'"
    >
      {{ outcome?.text }}
    </p>
  </div>
</template>
