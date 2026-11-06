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
    class="flex items-center gap-4"
    :class="!lead && 'border-t-2 border-dashed pt-4'"
  >
    <img
      v-if="qr"
      :src="qr"
      :alt="$t('events.page.ticket.qr_alt')"
      class="size-28 shrink-0 rounded-sm bg-white p-1"
    />
    <div v-else class="size-28 shrink-0 rounded-sm bg-muted" />
    <figcaption class="flex min-w-0 flex-col gap-1">
      <span class="font-bold">{{ title }}</span>
      <span class="text-sm">{{ name }}</span>
      <span
        class="text-sm whitespace-nowrap text-muted-foreground tabular-nums"
      >
        {{ when }}
      </span>
      <span
        v-if="room"
        class="w-fit rounded-sm bg-plate px-1.5 pt-0.5 text-sm font-extrabold text-plate-foreground"
      >
        {{ room }}
      </span>
      <span class="text-sm">{{ $t('events.page.ticket.show') }}</span>
    </figcaption>
  </figure>
</template>
