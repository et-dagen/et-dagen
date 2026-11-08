<script setup lang="ts">
  import { Card, CardTitle } from '@/components/ui/card'
  import { mapEmbedOf, type PublicEvent } from '@/lib/eventPage'

  const props = defineProps<{ event: PublicEvent }>()

  const mapEmbed = computed(() => mapEmbedOf(props.event.location?.map))
</script>

<template>
  <Card
    class="tw:gap-0 tw:rounded-lg tw:border-0 tw:py-0 tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178571em] tw:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14),0_1px_10px_0_rgba(0,0,0,0.12)]"
  >
    <CardTitle
      class="tw:truncate tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
    >
      {{ event.title }}
    </CardTitle>
    <!-- the API cleans descriptions before they reach the page -->
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="description tw:mb-3 tw:px-4 tw:pb-4 tw:whitespace-pre-line"
      v-html="event.description"
    />
    <!-- eslint-enable -->
    <!-- the map is a picture of the place; a tap opens MazeMap, so the map never traps a scroll.
         The location link in the details says the same for keyboards and screen readers. -->
    <div v-if="mapEmbed" class="tw:px-4 tw:pb-4">
      <a
        :href="event.location?.map ?? undefined"
        target="_blank"
        rel="noopener noreferrer"
        tabindex="-1"
        aria-hidden="true"
        class="tw:block tw:h-72 tw:overflow-hidden tw:rounded-lg"
      >
        <iframe
          :src="mapEmbed"
          title=""
          loading="lazy"
          referrerpolicy="no-referrer"
          tabindex="-1"
          class="tw:pointer-events-none tw:block tw:size-full tw:border-0"
        />
      </a>
    </div>
  </Card>
</template>

<style scoped>
  /* the description is rich text from the editor, so its lists and headings need their own look */
  .description :deep(ul) {
    list-style: disc;
  }

  .description :deep(ol) {
    list-style: decimal;
  }

  .description :deep(li) {
    list-style-position: inside;
  }

  .description :deep(li p) {
    display: inline;
  }

  .description :deep(h5) {
    font-size: 1.15rem;
  }

  .description :deep(h6) {
    font-size: 1.05rem;
  }
</style>
