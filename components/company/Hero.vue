<script setup lang="ts">
  export interface CompanyInfo {
    name: string
    description: string
    logo: string
    website: string
  }

  const company = defineProps({
    content: {
      type: Object as PropType<CompanyInfo>,
      required: true,
    },
  })

  const openNewTab = () => {
    navigateTo(company.content.website, {
      external: true,
      open: {
        target: '_blank',
      },
    })
  }
</script>

<template>
  <div>
    <VSheet class="w-75">
      <h2
        class="text-md-h2 text-sm-h3 text-h4 text-center pb-10 font-weight-bold"
      >
        Hovedpartner
      </h2>

      <VRow class="pt-10">
        <!-- Company logo -->
        <VCol cols="12" lg="6" style="cursor: pointer">
          <VHover v-slot="{ isHovering, props }">
            <VCard
              :elevation="isHovering ? 20 : 0"
              :class="{ 'on-hover': isHovering }"
              v-bind="props"
              @click="openNewTab()"
            >
              <VImg
                class="w-100 elevation-3 rounded-lg"
                :src="company.content.logo"
                :alt="`${company.content.name}'s logo`"
              />
            </VCard>
          </VHover>
        </VCol>

        <!-- Company name and description -->
        <!-- Scroll bar if text is too long -->
        <VCol cols="12" lg="6" style="max-height: 40vh" class="overflow-y-auto">
          <VHover v-slot="{ isHovering, props }">
            <VCard
              :elevation="isHovering ? 20 : 0"
              :class="{ 'on-hover': isHovering }"
              v-bind="props"
              class="text-lg-h4 text-h5 font-weight-bold d-inline-block"
              style="cursor: pointer"
              @click="openNewTab()"
            >
              {{ company.content.name }} &#8599;
            </VCard>
          </VHover>
          <p>{{ company.content.description }}</p>
        </VCol>
      </VRow>
    </VSheet>
  </div>
</template>
