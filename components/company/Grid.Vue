<script setup lang="ts">
  import { PropType } from 'nuxt/dist/app/compat/capi'
  //define the contents of CompanyInformation
  interface CompanyInformation {
    logo: string
    website: string
  }
  //The grid uses a grid of CompanyInformation
  defineProps({
    content: { type: Array as PropType<CompanyInformation[]>, required: true },
  })
</script>

<template>
  <VContainer >
    <!--class centeres the contents in the rows-->
    <VRow class="d-flex justify-center">
    <!--
      v-for iterates over all content & creates CompanyCards
      cols="6": if on phone each row contain 2 logos
      lg="3": if on PC each row contain 4 logos
    -->
      <VCol cols="6" lg="3" v-for="n in content">
        <CompanyCard
        :content="{
        logo: n.logo,
        website: n.website,
        }"
        />
      </VCol>
    </VRow>
  </VContainer>
</template>

