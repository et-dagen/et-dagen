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
      <v-img
        :width="500"
        aspect-ratio="4/3"
        cover
        src="https://1000logos.net/wp-content/uploads/2021/05/Sony-logo.png"
      ></v-img>
    </v-card>
  </v-hover>
</template>

<script>
  export default {
    methods: {
      redirectToWebsite() {
        window.open('https://pro.sony/en_NO/home', '_blank')
      },
    },
  }
</script>
