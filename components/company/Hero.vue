<script setup lang="ts">
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
    <VCard class="companyWrapper" variant="flat">
      <VRow no-gutters>
        <!-- Company logo -->
        <VCol cols="12" lg="7" class="d-flex justify-center pr-lg-3">
          <NuxtImg
            class="companyImage"
            :src="content.logo"
            @click="
              navigateTo(content.webpage, {
                external: true,
                open: { target: '_blank' },
              })
            "
          />
        </VCol>

        <!-- Company name and description -->
        <VCol cols="12" lg="5" class="pt-lg-0 pt-3 pl-lg-3 companyHero">
          <h3
            class="text-h5 font-weight-bold clicker d-inline-block"
            @click="
              navigateTo(content.webpage, {
                external: true,
                open: { target: '_blank' },
              })
            "
          >
            {{ content.name }}
          </h3>
          <p class="pt-1 pt-lg-3">{{ content.description }}</p>
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>

<style setup lang="scss">
  @use 'vuetify/settings';

  .companyWrapper {
    max-height: 100vh;
    width: 70vw;

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 90vw;
    }
  }

  .companyHero {
    > p {
      display: -webkit-box;
      overflow: hidden;
      // // -webkit-line-clamp: 5;
      text-overflow: ellipsis;
      -webkit-box-orient: vertical;

      @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
        -webkit-line-clamp: 12;
      }
      @media #{map-get(settings.$display-breakpoints, 'md')} {
        -webkit-line-clamp: 8;
      }
      @media #{map-get(settings.$display-breakpoints, 'lg-and-up')} {
        -webkit-line-clamp: 6;
      }
    }
  }

  .clicker:hover {
    cursor: pointer;
    text-decoration: underline;
  }

  .companyImage {
    color: transparent;
    background-color: transparent;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    cursor: pointer;
    max-width: 100%;
    object-fit: contain;
    max-height: 100%;

    &:hover {
      transform: scale(1.03);
    }
  }
</style>
