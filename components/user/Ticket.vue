<script setup lang="ts">
  import { MapPin } from '@lucide/vue'
  import * as qrcode from 'qrcode'
  import { Card } from '@/components/ui/card'
  import { placeOf } from '@/lib/events'
  import { formatWhen } from '@/lib/time'
  import type { SignUpRow } from '@/lib/user/signUps'

  const props = defineProps<{ row: SignUpRow; uid: string }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()

  // the door scanner reads the user's id, so every ticket carries the same code
  const qr = ref('')
  onMounted(async () => {
    const svg = await qrcode.toString(props.uid, { type: 'svg', margin: 0 })
    qr.value = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  })

  const place = computed(() => placeOf(props.row.event.location?.name))
  const when = computed(() =>
    formatWhen(props.row.event.date?.start, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }),
  )
</script>

<template>
  <Card
    class="tw:my-2 tw:flex-col tw:items-center tw:gap-0 tw:rounded tw:border tw:border-black/12 tw:p-4 tw:shadow-none tw:min-[600px]:flex-row"
  >
    <img
      v-if="qr"
      :src="qr"
      :alt="$t('user.page.qr')"
      class="tw:size-[140px]"
    />
    <div class="tw:mt-4 tw:min-[600px]:mt-0 tw:min-[600px]:ml-6">
      <NuxtLink
        :to="localePath(`/event/${row.eventUID}`)"
        class="tw:font-bold tw:text-brand"
      >
        {{ row.event.title }}
      </NuxtLink>
      <p class="tw:my-1 tw:first-letter:uppercase">{{ when }}</p>
      <p v-if="place.code || place.name" class="tw:my-1">
        <MapPin
          aria-hidden="true"
          class="tw:mr-1 tw:inline tw:size-5 tw:align-[-4px] tw:text-brand"
        />
        {{ [place.code, place.name].filter(Boolean).join(' · ') }}
      </p>
      <p class="tw:my-1 tw:text-[#7a7a7a]">
        {{ $t('user.page.show_code') }}
      </p>
    </div>
  </Card>
</template>
