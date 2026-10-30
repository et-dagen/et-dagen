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
    <iframe
      v-if="mapEmbed"
      :src="mapEmbed"
      :title="$t('events.page.map_title', { place: event.location?.name })"
      loading="lazy"
      referrerpolicy="no-referrer"
      class="tw:h-72 tw:w-full tw:rounded-lg tw:border tw:bg-card"
    />
    <a
      v-else-if="event.location?.map"
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
