<!-- VuetifyCarousel.vue -->
<template>
  <div
    ref="carouselWrapper"
    class="carousel-wrapper"
    :class="{ 'carousel-visible': isVisible }"
  >
    <div class="carousel-container-wrapper">
      <v-carousel
        v-model="currentSlide"
        cycle
        :show-arrows="false"
        hide-delimiters
        :interval="7000"
        height="85vh"
        class="carousel-container"
        hide-controls
        transition="slide-x-transition"
        reverse-transition="slide-x-reverse-transition"
      >
        <v-carousel-item
          v-for="(item, index) in carouselItems"
          :key="index"
          :src="item.src"
          cover
          class="carousel-item"
        >
          <div class="image-overlay"></div>
        </v-carousel-item>
      </v-carousel>
      <!-- Left Arrow -->
      <div class="arrow arrow-left" @click="prevSlide">
        <v-icon>mdi-chevron-left</v-icon>
      </div>
      <!-- Right Arrow -->
      <div class="arrow arrow-right" @click="nextSlide">
        <v-icon>mdi-chevron-right</v-icon>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'VuetifyCarousel',
    data() {
      return {
        carouselItems: [
          { src: '/images/prevYear/Ballongslipp_2.JPG' },
          { src: '/images/prevYear/Glassgarden_overblikk_1.JPG' },
          { src: '/images/prevYear/Inngang_1.JPG' },
        ],
        isVisible: false,
        observer: null,
        currentSlide: 0,
      }
    },
    mounted() {
      this.setupIntersectionObserver()
    },
    beforeUnmount() {
      if (this.observer) {
        this.observer.disconnect()
      }
    },
    methods: {
      setupIntersectionObserver() {
        // Trigger the lazy-load effect only once.
        this.observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries
            if (entry.isIntersecting) {
              this.isVisible = true
              // Once visible, disconnect the observer to prevent further toggling.
              this.observer.disconnect()
            }
          },
          {
            threshold: 0.1,
            rootMargin: '0px',
          },
        )
        this.observer.observe(this.$refs.carouselWrapper)
      },
      nextSlide() {
        // Move to the next slide, looping back if needed.
        const nextIndex = (this.currentSlide + 1) % this.carouselItems.length
        this.currentSlide = nextIndex
      },
      prevSlide() {
        // Move to the previous slide, looping back if needed.
        const prevIndex =
          (this.currentSlide - 1 + this.carouselItems.length) %
          this.carouselItems.length
        this.currentSlide = prevIndex
      },
    },
  }
</script>

<style scoped>
  /* Entrance animation for the carousel when scrolling into view */
  .carousel-wrapper {
    opacity: 0;
    transform: translateY(100px);
    transition:
      opacity 0.6s ease,
      transform 0.6s ease;
  }

  .carousel-wrapper.carousel-visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Wrapper for the carousel to position the arrow overlays */
  .carousel-container-wrapper {
    position: relative;
    max-width: 75vw;
    margin: 0 auto;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  /* The carousel container itself */
  .carousel-container {
    position: relative;
    overflow: hidden;
  }

  /* Arrow styles */
  .arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border-radius: 50%;
    cursor: pointer;
    transition: opacity 0.3s ease;
    opacity: 0;
  }

  /* Show the arrows when hovering over the carousel container wrapper */
  .carousel-container-wrapper:hover .arrow {
    opacity: 1;
  }

  .arrow-left {
    left: 10px;
  }

  .arrow-right {
    right: 10px;
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.2) 0%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  /* Hide Vuetify’s default carousel controls */
  :deep(.v-carousel__controls) {
    display: none;
  }
</style>
