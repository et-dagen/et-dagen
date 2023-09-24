<template>
  <div>
    <v-sheet class="w-75">
      <v-row no-gutters>
        <v-col cols="12" lg="6" style="cursor: pointer" @click="redirect()">
          <v-img
            class="w-100"
            :src="company.content.logo"
            :alt="`${company.content.name}'s logo`"
          />
        </v-col>
        <v-col
          cols="12"
          lg="6"
          style="max-height: 40vh"
          class="overflow-y-auto"
        >
          <h4
            class="text-lg-h4 text-h5 font-weight-bold w-auto d-inline-block"
            style="cursor: pointer"
            @click="redirect()"
          >
            {{ company.content.name }} &#8599;
          </h4>
          <p>{{ company.content.description }}</p>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>

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

  const redirect = () => {
    window.location.replace(company.content.website)
  }
</script>
