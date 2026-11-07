<script setup lang="ts">
  import { mapEmbedOf, type PublicEvent } from '@/lib/eventPage'

  const props = defineProps<{ event: PublicEvent }>()

  const mapEmbed = computed(() => mapEmbedOf(props.event.location?.map))
</script>

<template>
  <VCard class="description elevation-4" rounded="lg">
    <VCardTitle class="description__title">{{ event.title }}</VCardTitle>
    <!-- the API cleans descriptions before they reach the page -->
    <!-- eslint-disable vue/no-v-text-v-html-on-component vue/no-v-html -->
    <VCardText class="description__text mb-3" v-html="event.description" />
    <!-- eslint-enable -->
    <!-- the map is a picture of the place; a tap opens MazeMap, so the map never traps a scroll.
         The location link in the details says the same for keyboards and screen readers. -->
    <VCardText v-if="mapEmbed" class="pt-0">
      <a
        :href="event.location?.map ?? undefined"
        target="_blank"
        rel="noopener noreferrer"
        tabindex="-1"
        aria-hidden="true"
        class="map"
      >
        <iframe
          :src="mapEmbed"
          title=""
          loading="lazy"
          referrerpolicy="no-referrer"
          tabindex="-1"
        />
      </a>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
  .description {
    :deep(li) {
      list-style-position: inside;

      p {
        display: inline;
      }
    }

    :deep(h5) {
      font-size: 1.15rem !important;
    }

    :deep(h6) {
      font-size: 1.05rem !important;
    }

    &__text {
      white-space: pre-line;
    }
  }

  .map {
    display: block;
    height: 18rem;
    overflow: hidden;
    border-radius: 8px;

    iframe {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      pointer-events: none;
    }
  }
</style>
