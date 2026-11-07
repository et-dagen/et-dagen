<script setup lang="ts">
  import type { PropType } from 'vue'

  export interface HomeBannerContent {
    caption: string
    /** Such as "9. - 10. februar"; null hides the line */
    dates: string | null
    image: string
    title: string
  }

  defineProps({
    content: { type: Object as PropType<HomeBannerContent>, required: true },
  })
</script>

<template>
  <div class="pb-lg-9 py-md-7">
    <VCard variant="flat" width="60vw" min-width="290px">
      <VRow>
        <!-- banner title and caption -->
        <VCol cols="12" md="7">
          <h5 v-if="content.dates" class="pt-md-7">{{ content.dates }}</h5>

          <!-- h4 for under lg breakpoint and h3 above -->
          <h3 class="py-3 text-h4 text-md-h3 font-weight-bold">
            {{ content.title }}
          </h3>

          <h6>{{ content.caption }}</h6>
        </VCol>
        <VCol cols="5" class="d-flex flex-row-reverse">
          <!-- banner image -->
          <img
            class="d-none d-md-flex rounded-lg"
            height="250"
            width="250"
            :src="content.image"
            alt=""
          />
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>
