<script setup lang="ts">
  interface CompanyInfo {
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
</script>

<template>
  <div>
    <VSheet class="w-75">
      <VRow no-gutters>
        <VCol
          cols="12"
          lg="6"
          style="cursor: pointer"
          @click="navigateTo(company.content.website, { external: true })"
        >
          <VImg
            class="w-100"
            :src="company.content.logo"
            :alt="`${company.content.name}'s logo`"
          />
        </VCol>
        <VCol cols="12" lg="6" style="max-height: 40vh" class="overflow-y-auto">
          <h4
            class="text-lg-h4 text-h5 font-weight-bold w-auto d-inline-block"
            style="cursor: pointer"
            @click="navigateTo(company.content.website, { external: true })"
          >
            {{ company.content.name }} &#8599;
          </h4>
          <p>{{ company.content.description }}</p>
        </VCol>
      </VRow>
    </VSheet>
  </div>
</template>
