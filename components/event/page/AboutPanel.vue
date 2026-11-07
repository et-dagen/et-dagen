<script setup lang="ts">
  import { ExternalLink, MapPin } from '@lucide/vue'
  import { mapEmbedOf, type PublicEvent } from '@/lib/eventPage'

  const props = defineProps<{ event: PublicEvent }>()

  const mapEmbed = computed(() => mapEmbedOf(props.event.location?.map))
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- the API cleans descriptions before they reach the page -->
    <!-- eslint-disable vue/no-v-html -->
    <div v-if="event.description" class="et-prose" v-html="event.description" />
    <!-- eslint-enable vue/no-v-html -->
    <!-- the map is a picture of the place; a tap opens MazeMap, so the map never traps a scroll.
         The link below says the same for keyboards and screen readers. -->
    <a
      v-if="mapEmbed"
      :href="event.location?.map"
      target="_blank"
      rel="noopener noreferrer"
      tabindex="-1"
      aria-hidden="true"
      class="block h-72 overflow-hidden rounded-lg border bg-card"
    >
      <iframe
        :src="mapEmbed"
        title=""
        loading="lazy"
        referrerpolicy="no-referrer"
        tabindex="-1"
        class="pointer-events-none block size-full"
      />
    </a>
    <a
      v-if="event.location?.map"
      :href="event.location.map"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex w-fit items-center gap-2 font-semibold underline decoration-border underline-offset-4"
    >
      <MapPin class="size-4" aria-hidden="true" />
      {{ $t('events.page.open_map') }}
      <ExternalLink class="size-3.5" aria-hidden="true" />
    </a>
  </div>
</template>
