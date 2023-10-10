<script setup lang="ts">
  export interface CompanyInfo {
    name: string
    description: string
    logo: string
    website: string
  }

  const openInNewTab = () => {
    navigateTo(company.content.website, {
      external: true,
      open: {
        target: '_blank',
      },
    })
  }

  const company = defineProps({
    content: {
      type: Object as PropType<CompanyInfo>,
      required: true,
    },
  })
  const { lgAndUp } = useDisplay()
</script>

<template>
  <div>
    <VSheet :width="lgAndUp ? '75vw' : '90vw'">
      <br />
      <h2
        :class="`text-md-h2 text-sm-h3 text-h4 text-center 
        pt-10 pb-lg-3 pb-5 font-weight-bold`"
      >
        {{ $t('company.main_partner') }}
      </h2>

      <VRow class="pt-lg-10" no-gutters>
        <!-- Company logo -->
        <VCol cols="12" lg="6" style="cursor: pointer" class="pr-lg-3">
          <VImg
            class="w-100 rounded-lg companyImage"
            :src="company.content.logo"
            :alt="`${company.content.name}'s logo`"
            @click="openInNewTab"
          />
        </VCol>

        <!-- Company name and description -->
        <VCol
          cols="12"
          lg="6"
          style="max-height: 40vh"
          class="pt-lg-0 pt-3 pl-lg-3"
        >
          <VHover v-slot="{ isHovering, props }">
            <VSheet
              :class="{ 'on-hover': isHovering }"
              v-bind="props"
              class="d-inline-block"
              :style="isHovering ? 'cursor: pointer' : ''"
              @click="openInNewTab"
            >
              <h3
                :class="isHovering ? 'text-decoration-underline' : ''"
                class="text-lg-h4 text-h5 font-weight-bold"
              >
                {{ company.content.name }}
              </h3>
            </VSheet>
          </VHover>
          <p class="pt-1 pt-lg-3">{{ company.content.description }}</p>
        </VCol>
      </VRow>
    </VSheet>
  </div>
</template>

<style setup lang="scss">
  .companyImage {
    color: transparent;
    background-color: transparent;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    filter: drop-shadow(2px 2px 1px gray);
    &:hover {
      filter: drop-shadow(4px 4px 2px gray);
      transform: scale(1.05);
    }
  }
</style>
