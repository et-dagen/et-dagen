<script setup lang="ts">
  import type { PropType } from 'vue'

  export interface CompanyInfo {
    name: string
    description: string
    logo: string
    webpage: string
  }

  defineProps({
    content: {
      type: Object as PropType<CompanyInfo>,
      required: true,
    },
  })
</script>

<template>
  <div>
    <div
      class="tw:max-h-screen tw:w-[90vw] tw:bg-white tw:min-[960px]:w-[70vw]"
    >
      <div class="tw:flex tw:flex-wrap">
        <div
          class="tw:flex tw:w-full tw:justify-center tw:min-[1280px]:w-7/12 tw:min-[1280px]:pr-3"
        >
          <img
            class="tw:max-h-full tw:max-w-full tw:cursor-pointer tw:object-contain tw:transition-transform tw:duration-200 tw:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] tw:hover:scale-[1.03]"
            alt=""
            :src="content.logo"
            @click="
              navigateTo(content.webpage, {
                external: true,
                open: { target: '_blank' },
              })
            "
          />
        </div>

        <div
          class="tw:w-full tw:pt-3 tw:min-[1280px]:w-5/12 tw:min-[1280px]:pt-0 tw:min-[1280px]:pl-3"
        >
          <h3
            class="tw:inline-block tw:cursor-pointer tw:text-2xl tw:leading-[1.333] tw:font-bold tw:hover:underline"
            @click="
              navigateTo(content.webpage, {
                external: true,
                open: { target: '_blank' },
              })
            "
          >
            {{ content.name }}
          </h3>
          <p
            class="tw:line-clamp-12 tw:pt-1 tw:min-[960px]:line-clamp-8 tw:min-[1280px]:line-clamp-6 tw:min-[1280px]:pt-3"
          >
            {{ content.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
