<script setup lang="ts">
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

  const startDate = new Date(props.content.date.start)
  const endDate = new Date(props.content.date.end)
</script>

<template>
  <div class="pb-lg-9 py-md-7">
    <VCard variant="flat" width="60vw" min-width="290px">
      <VRow>
        <!-- banner title and caption -->
        <VCol cols="12" lg="7">
          <h5 class="pt-md-7">
            {{ startDate.getDate() }}.
            {{
              !isSameMonth(content.date.start, content.date.end)
                ? $t(
                    `datetime.months.${getFullMonthFromNumber(
                      startDate.getMonth()
                    )}`
                  )
                : ''
            }}
            - {{ endDate.getDate() }}.
            {{
              $t(
                `datetime.months.${getFullMonthFromNumber(endDate.getMonth())}`
              )
            }}
          </h5>

          <!-- h4 for under lg breakpoint and h3 above -->
          <h3 class="py-3 text-h4 text-md-h3 font-weight-bold">
            {{ content.title }}
          </h3>

          <h6>{{ content.caption }}</h6>
        </VCol>
        <VCol cols="5">
          <!-- banner image -->
          <VImg
            class="d-none d-lg-flex elevation-3 rounded-lg"
            :aspect-ratio="4 / 3"
            cover
            :src="content.image"
          ></VImg>
        </VCol>
      </VRow>
    </VCard>
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
