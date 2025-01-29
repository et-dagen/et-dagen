<!-- VuetifyCarousel.vue -->

<template>
  <v-carousel cycle :interval="5000" height="700px" class="mx-auto my-5">
    <v-carousel-item
      v-for="(item, index) in carouselItems"
      :key="index"
      :src="item.src"
      cover
    ></v-carousel-item>
  </v-carousel>
</template>

<script>
  export default {
    name: 'VuetifyCarousel',
    data() {
      return {
        carouselItems: [
          { src: '/images/board/business.jpg' },
          { src: 'https://cdn.vuetifyjs.com/images/cards/hotel.jpg' },
          { src: 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg' },
        ],
      }
    },
  }
</script>

<style scoped>
  .v-carousel {
    max-width: 70%;
    margin: 0 auto;
  }

  .v-carousel-item img {
    object-fit: cover;
    width: 80%;
    height: 80%;
  }
</style>
