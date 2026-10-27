<script setup lang="ts">
  import * as qrcode from 'qrcode'
  import { placeOf } from '@/lib/admin/events'
  import { formatWhen } from '@/lib/admin/time'
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
    class="tw:relative tw:grid tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card tw:sm:grid-cols-[13rem_minmax(0,1fr)]"
  >
    <div
      class="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:bg-plate tw:p-6 tw:text-plate-foreground"
    >
      <div class="tw:size-40 tw:rounded-md tw:bg-white tw:p-3">
        <img
          v-if="qr"
          :src="qr"
          :alt="$t('user.page.qr')"
          class="tw:size-full"
        />
      </div>
      <p class="tw:font-bold">{{ $t('user.page.show_code') }}</p>
    </div>

    <div
      class="tw:relative tw:flex tw:flex-col tw:border-dashed tw:border-foreground/30 tw:p-6 tw:max-sm:border-t-2 tw:sm:border-l-2 tw:lg:p-8"
    >
      <!-- the tear line's notches, cut out of the ticket's edge -->
      <span
        v-for="side in [
          'tw:max-sm:-left-3 tw:sm:-top-3',
          'tw:max-sm:-right-3 tw:sm:-bottom-3',
        ]"
        :key="side"
        aria-hidden="true"
        class="tw:absolute tw:size-6 tw:rounded-full tw:border tw:bg-background tw:max-sm:-top-3 tw:sm:-left-3"
        :class="side"
      />
      <h3 class="tw:text-xl tw:leading-snug tw:font-extrabold tw:lg:text-2xl">
        <NuxtLink
          :to="localePath(`/event/${row.eventUID}`)"
          class="tw:hover:underline tw:hover:decoration-brand tw:hover:decoration-2 tw:hover:underline-offset-4"
        >
          {{ row.event.title }}
        </NuxtLink>
      </h3>
      <p
        class="tw:mt-2 tw:font-semibold tw:text-muted-foreground tw:first-letter:uppercase"
      >
        {{ day }}
      </p>
      <div
        class="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-5 tw:gap-y-2"
      >
        <span
          class="tw:text-6xl tw:font-black tw:tracking-[-0.04em] tw:tabular-nums tw:lg:text-7xl"
        >
          {{ time }}
        </span>
        <span
          v-if="place.code || place.name"
          class="tw:flex tw:flex-col tw:gap-1"
        >
          <span
            v-if="place.code"
            class="tw:self-start tw:rounded-md tw:bg-plate tw:px-3 tw:pt-1.5 tw:pb-1 tw:text-3xl tw:font-black tw:text-plate-foreground"
          >
            {{ place.code }}
          </span>
          <span class="tw:font-semibold tw:text-muted-foreground">
            {{ place.name }}
          </span>
        </span>
      </div>
      <div
        class="tw:mt-6 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:border-t tw:pt-4"
      >
        <span class="tw:font-bold">{{ holder }}</span>
        <span
          class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded tw:bg-muted tw:px-2.5 tw:pt-1 tw:pb-0.5 tw:text-sm tw:font-bold tw:text-plate"
        >
          <span
            class="tw:size-2 tw:rounded-full tw:bg-plate"
            aria-hidden="true"
          />
          {{ $t('user.page.attending') }}
        </span>
      </div>
    </div>
  </article>
</template>
