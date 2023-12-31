<script setup lang="ts">
  export interface CompanyInfo {
    name: string
    description: string
    logo: string
    webpage: string
  }

  const openInNewTab = () => {
    navigateTo(company.content.webpage, {
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
  const { xs } = useDisplay()
</script>

<template>
  <div>
    <VSheet :width="xs ? '90vw' : '65vw'">
      <!-- This header should not be smaller than h3 for large screens -->
      <h2
        :class="`text-sm-h3 text-h4 text-center 
        pt-10 pb-lg-6 pb-3 font-weight-bold`"
      >
        {{ $t('company.main_partner') }}
      </h2>

      <VRow no-gutters>
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
          <h3
            class="text-h5 font-weight-bold clicker d-inline-block"
            @click="openInNewTab"
          >
            {{ company.content.name }}
          </h3>
          <p class="pt-1 pt-lg-3">{{ company.content.description }}</p>
        </VCol>
      </VRow>
    </VSheet>
  </div>
</template>

<style setup lang="scss">
  .clicker:hover {
    cursor: pointer;
    text-decoration: underline;
  }

  .companyImage {
    color: transparent;
    background-color: transparent;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    &:hover {
      transform: scale(1.03);
    }
  }
</style>
