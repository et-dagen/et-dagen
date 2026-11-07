<script setup lang="ts">
  import { ExternalLink, MapPin } from '@lucide/vue'
  import { mapEmbedOf, type PublicEvent } from '@/lib/eventPage'

  const props = defineProps<{ event: PublicEvent }>()

  const mapEmbed = computed(() => mapEmbedOf(props.event.location?.map))
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-6">
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
      class="tw:block tw:h-72 tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
    >
      <iframe
        :src="mapEmbed"
        title=""
        loading="lazy"
        referrerpolicy="no-referrer"
        tabindex="-1"
        class="tw:pointer-events-none tw:block tw:size-full"
      />
    </a>
    <a
      v-if="event.location?.map"
      :href="event.location.map"
      target="_blank"
      rel="noopener noreferrer"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-2 tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
    >
      <MapPin class="tw:size-4" aria-hidden="true" />
      {{ $t('events.page.open_map') }}
      <ExternalLink class="tw:size-3.5" aria-hidden="true" />
    </a>
  </div>
</template>
