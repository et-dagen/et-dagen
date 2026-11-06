<script setup lang="ts">
  import * as qrcode from 'qrcode'
  import { placeOf } from '@/lib/events'
  import { formatWhen } from '@/lib/time'
  import type { SignUpRow } from '@/lib/user/signUps'

  const props = defineProps<{ row: SignUpRow; holder: string; uid: string }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()

  // the door scanner reads the user's id, so every ticket carries the same code
  const qr = ref('')
  onMounted(async () => {
    const svg = await qrcode.toString(props.uid, { type: 'svg', margin: 0 })
    qr.value = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  })

  const place = computed(() => placeOf(props.row.event.location?.name))
  const day = computed(() =>
    formatWhen(props.row.event.date?.start, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  )
  const time = computed(() =>
    formatWhen(props.row.event.date?.start, locale.value, {
      hour: '2-digit',
      minute: '2-digit',
    }),
  )
</script>

<template>
  <article
    class="relative grid overflow-hidden rounded-lg border bg-card sm:grid-cols-[13rem_minmax(0,1fr)]"
  >
    <div
      class="flex flex-col items-center justify-center gap-4 bg-plate p-6 text-plate-foreground"
    >
      <div class="size-40 rounded-md bg-white p-3">
        <img v-if="qr" :src="qr" :alt="$t('user.page.qr')" class="size-full" />
      </div>
      <p class="font-bold">{{ $t('user.page.show_code') }}</p>
    </div>

    <div
      class="relative flex flex-col border-dashed border-foreground/30 p-6 max-sm:border-t-2 sm:border-l-2 lg:p-8"
    >
      <!-- the tear line's notches, cut out of the ticket's edge -->
      <span
        v-for="side in [
          'max-sm:-left-3 sm:-top-3',
          'max-sm:-right-3 sm:-bottom-3',
        ]"
        :key="side"
        aria-hidden="true"
        class="absolute size-6 rounded-full border bg-background max-sm:-top-3 sm:-left-3"
        :class="side"
      />
      <h3 class="text-xl leading-snug font-extrabold lg:text-2xl">
        <NuxtLink
          :to="localePath(`/event/${row.eventUID}`)"
          class="hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4"
        >
          {{ row.event.title }}
        </NuxtLink>
      </h3>
      <p
        class="mt-2 font-semibold text-muted-foreground first-letter:uppercase"
      >
        {{ day }}
      </p>
      <div class="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span
          class="text-6xl font-black tracking-[-0.04em] tabular-nums lg:text-7xl"
        >
          {{ time }}
        </span>
        <span v-if="place.code || place.name" class="flex flex-col gap-1">
          <span
            v-if="place.code"
            class="self-start rounded-md bg-plate px-3 pt-1.5 pb-1 text-3xl font-black text-plate-foreground"
          >
            {{ place.code }}
          </span>
          <span class="font-semibold text-muted-foreground">
            {{ place.name }}
          </span>
        </span>
      </div>
      <div class="mt-6 flex flex-wrap items-center gap-3 pt-2 sm:mt-auto">
        <span class="font-bold">{{ holder }}</span>
        <span
          class="inline-flex items-center gap-2 rounded-full bg-muted px-3 pt-1 pb-0.5 text-sm font-bold text-plate"
        >
          <span class="size-2 rounded-full bg-plate" aria-hidden="true" />
          {{ $t('user.page.attending') }}
        </span>
      </div>
    </div>
  </article>
</template>
