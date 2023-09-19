<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      :elevation="isHovering ? 10 : 0"
      :class="{ 'on-hover': isHovering }"
      class="mx-auto d-flex align-center justify-center"
      height="125"
      max-width="250"
      v-bind="props"
      @click="redirectToWebsite"
    >
      <v-img :width="500" aspect-ratio="4/3" cover :src="content.logo"></v-img>
    </v-card>
  </v-hover>
</template>

<script setup lang="ts">
  export interface CompanyCardContent {
    logo: string
    website: string
  }

  const props = defineProps({
    content: { type: Object as PropType<CompanyCardContent>, required: true },
  })

  const redirectToWebsite = () => {
    window.open(props.content.website)
  }
</script>
