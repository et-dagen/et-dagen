<script setup lang="ts">
  import * as qrcode from 'qrcode'

  const props = defineProps<{
    /** The signed-in user's uid, which the door scanner reads */
    uid: string
  }>()

  // drawn in the browser only; the server has no reason to know who is looking
  const qr = ref('')
  onMounted(async () => {
    const svg = await qrcode.toString(props.uid, {
      type: 'svg',
      width: 200,
      margin: 1,
    })
    qr.value = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  })
</script>

<template>
  <span class="qr-wrapper">
    <img v-if="qr" :src="qr" :alt="$t('events.page.ticket.qr_alt')" />
  </span>
</template>

<style scoped lang="scss">
  .qr-wrapper {
    display: flex;
    justify-content: center;
  }
</style>
