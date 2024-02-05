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
        <VCol cols="12" md="7">
          <h5 class="pt-md-7">
            {{ startDate.getDate() }}.
            {{
              !isSameMonth(content.date.start, content.date.end)
                ? getFullMonthFromNumber(startDate.getMonth())
                : ''
            }}
            - {{ endDate.getDate() }}.
            {{ getFullMonthFromNumber(endDate.getMonth()) }}
          </h5>

          <!-- h4 for under lg breakpoint and h3 above -->
          <h3 class="py-3 text-h4 text-md-h3 font-weight-bold">
            {{ content.title }}
          </h3>

          <h6>{{ content.caption }}</h6>
        </VCol>
        <VCol cols="5" class="d-flex flex-row-reverse">
          <!-- banner image -->
          <NuxtImg
            class="d-none d-md-flex rounded-lg"
            height="250"
            width="250"
            :src="content.image"
          />
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>
