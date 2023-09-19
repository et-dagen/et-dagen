<script setup lang="ts">
  import { PropType } from 'nuxt/dist/app/compat/capi'

  interface CompanyInformation {
    logo: string
    website: string
  }

  defineProps({
    content: { type: Array as PropType<CompanyInformation[]>, required: true },
  })
</script>

<template>
  <v-container>
    <v-row>
    <!-- Style styrer høyde og slikt-->
      <v-col v-for="n in content">
        <CompanyCard
        :content="{
        logo: n.logo,
        website: n.website,
      }"
    />
      </v-col>
    </v-row>
  </v-container>
</template>
