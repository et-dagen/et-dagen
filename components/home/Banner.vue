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
  <div class="tw:min-[960px]:py-7 tw:min-[1280px]:pb-9">
    <div class="tw:w-[60vw] tw:min-w-[290px] tw:overflow-hidden tw:bg-white">
      <div class="tw:-m-3 tw:flex tw:flex-wrap">
        <div class="tw:w-full tw:p-3 tw:min-[960px]:w-7/12">
          <h5
            v-if="content.dates"
            class="tw:text-2xl tw:leading-[1.333] tw:font-normal tw:min-[960px]:pt-7"
          >
            {{ content.dates }}
          </h5>
          <h3
            class="tw:py-3 tw:text-[2.125rem] tw:leading-[1.175] tw:font-bold tw:tracking-[0.0073em] tw:min-[960px]:text-5xl tw:min-[960px]:leading-[1.05] tw:min-[960px]:tracking-normal"
          >
            {{ content.title }}
          </h3>
          <h6
            class="tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
          >
            {{ content.caption }}
          </h6>
        </div>
        <div class="tw:flex tw:w-5/12 tw:flex-row-reverse tw:p-3">
          <img
            class="tw:hidden tw:rounded-lg tw:min-[960px]:flex"
            height="250"
            width="250"
            :src="content.image"
            alt=""
          />
        </div>
      </div>
    </div>
  </div>
</template>
