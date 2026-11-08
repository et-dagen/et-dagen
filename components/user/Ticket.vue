<script setup lang="ts">
  import * as qrcode from 'qrcode'
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
  <VCard
    variant="outlined"
    class="d-flex flex-column flex-sm-row align-center pa-4 my-2"
  >
    <img v-if="qr" :src="qr" :alt="$t('user.page.qr')" class="ticket__qr" />
    <div class="ml-sm-6 mt-4 mt-sm-0">
      <NuxtLink
        :to="localePath(`/event/${row.eventUID}`)"
        class="text-primary font-weight-bold"
      >
        {{ row.event.title }}
      </NuxtLink>
      <p class="ticket__when my-1">{{ when }}</p>
      <p v-if="place.code || place.name" class="my-1">
        <VIcon size="small" color="primary" class="mr-1">mdi-map-marker</VIcon>
        {{ [place.code, place.name].filter(Boolean).join(' · ') }}
      </p>
      <p class="text-neutral-lighten-1 my-1">
        {{ $t('user.page.show_code') }}
      </p>
    </div>
  </VCard>
</template>

<style scoped lang="scss">
  .ticket__qr {
    width: 140px;
    height: 140px;
  }

  .ticket__when::first-letter {
    text-transform: uppercase;
  }
</style>
