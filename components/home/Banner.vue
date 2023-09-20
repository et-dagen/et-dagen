<script setup lang="ts">
  import { DateStringObject } from 'models/DateTime'

  export interface HomeBannerContent {
    caption: string
    date: {
      start: string
      end: string
    }
    image: string
    title: string
  }

  const props = defineProps({
    content: { type: Object as PropType<HomeBannerContent>, required: true },
  })

  // Convert event dates into readable and usable format
  const startDate = computed<DateStringObject>(() => {
    return dateStringToStringObject(props.content.date.start)
  })
  const endDate = computed<DateStringObject>(() => {
    return dateStringToStringObject(props.content.date.end)
  })
</script>

<template>
  <div class="home-banner">
    <!-- banner title and caption -->
    <div>
      <h5>
        {{ startDate.day }}.
        {{
          !isSameMonth(content.date.start, content.date.end)
            ? $t(`datetime.months.${startDate.month}`)
            : ''
        }}
        - {{ endDate.day }}. {{ $t(`datetime.months.${endDate.month}`) }}
      </h5>

      <!-- h4 for under lg breakpoint and h3 above -->
      <h3 class="text-h4 text-lg-h3 font-weight-bold">{{ content.title }}</h3>

      <h6>{{ content.caption }}</h6>
    </div>

    <!-- banner image -->
    <VImg
      class="d-none d-md-flex elevation-3 rounded-lg"
      :aspect-ratio="4 / 3"
      cover
      :src="content.image"
    ></VImg>
  </div>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  .home-banner {
    align-items: center;
    display: flex;
    gap: 4rem;
    justify-content: center;
    min-width: 310px;
    padding-block: 1rem;
    width: 100%;

    // All direct descendants
    > * {
      max-width: 25%;
    }

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      > * {
        max-width: 100%;
      }
    }
  }
</style>
