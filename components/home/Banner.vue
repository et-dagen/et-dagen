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

  const { mobile } = useDisplay()

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
    <div>
      <h3>
        {{ startDate.day }}.
        {{
          !isSameMonth(content.date.start, content.date.end)
            ? $t(`datetime.months.${startDate.month}`)
            : ''
        }}
        - {{ endDate.day }}. {{ $t(`datetime.months.${endDate.month}`) }}
      </h3>
      <h1>{{ content.title }}</h1>
      <h4>{{ content.caption }}</h4>
    </div>
    <v-img
      v-if="!mobile"
      :aspect-ratio="4 / 3"
      cover
      :src="content.image"
    ></v-img>
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
