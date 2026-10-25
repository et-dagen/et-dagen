<script setup lang="ts">
  import * as qrcode from 'qrcode'

  const props = defineProps<{
    /** The signed-in user's uid, which the door scanner reads */
    uid: string
    name: string
    /** The event, so a screenshot of the ticket says what it admits to */
    title: string
    when: string
    room: string | null
    /** At the top of the panel there is nothing above to tear off from */
    lead?: boolean
  }>()

  // drawn in the browser only; the server has no reason to know who is looking
  const qr = ref('')
  onMounted(async () => {
    const svg = await qrcode.toString(props.uid, {
      type: 'svg',
      margin: 0,
      color: { dark: '#2f3a45', light: '#ffffff' },
    })
    qr.value = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  })
</script>

<template>
  <figure
    class="tw:flex tw:items-center tw:gap-4"
    :class="!lead && 'tw:border-t-2 tw:border-dashed tw:pt-4'"
  >
    <img
      v-if="qr"
      :src="qr"
      :alt="$t('events.page.ticket.qr_alt')"
      class="tw:size-28 tw:shrink-0 tw:rounded-sm tw:bg-white tw:p-1"
    />
    <div v-else class="tw:size-28 tw:shrink-0 tw:rounded-sm tw:bg-muted" />
    <figcaption class="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
      <span class="tw:font-bold">{{ title }}</span>
      <span class="tw:text-sm">{{ name }}</span>
      <span
        class="tw:text-sm tw:whitespace-nowrap tw:text-muted-foreground tw:tabular-nums"
      >
        {{ when }}
      </span>
      <span
        v-if="room"
        class="tw:w-fit tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-sm tw:font-extrabold tw:text-plate-foreground"
      >
        {{ room }}
      </span>
      <span class="tw:text-sm">{{ $t('events.page.ticket.show') }}</span>
    </figcaption>
  </figure>
</template>
