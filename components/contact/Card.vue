<script setup lang="ts">
  export interface CardContent {
    name: string
    image: string
    position: string
    email: string
    phone?: string
  }

  defineProps({
    content: {
      type: Object as PropType<CardContent>,
      required: true,
    },
  })
</script>

<template>
  <div class="card">
    <NuxtImg
      class="card__image"
      :src="content.image"
      :alt="`Image of ${content.position}`"
    />
    <div class="card__text">
      <h4 class="card__title bold">{{ content.name }}</h4>
      <h5 class="card__position text-primary">{{ content.position }}</h5>
      <a :href="`mailto:${content.email}`" class="card__txt mt-3">
        <VIcon icon="mdi-email" color="primary" class="mr-2" />
        {{ content.email }}
      </a>
      <a
        v-if="content.phone"
        :href="`tel:${content.phone}`"
        class="card__txt mt-3"
      >
        <VIcon icon="mdi-phone" color="primary" class="mr-2" />{{
          content.phone
        }}</a
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';
  .bold {
    font-weight: bold;
  }

  .icon {
    color: rgb(var(--v-theme-primary));
  }

  .email {
    font-weight: bold;
  }

  span,
  a {
    color: var(--color-text-neutral);
  }

  /* Cards */
  .card {
    flex-wrap: wrap;
    display: flex;

    border-radius: 12px;
    margin: 0 0 2rem 0;
    overflow: hidden;
    position: relative;

    background: rgb(var(--v-theme-error)), transparent 50% !important;

    .card__title {
      font-size: 1.75rem;
    }

    .card__image {
      max-height: 180px;
      width: 100%;
      object-fit: cover;
      position: relative;
    }

    .card__text {
      padding: 1.5rem;
      position: relative;
      display: flex;
      flex-direction: column;
    }
  }

  // Set different max-widths for different screen sizes
  @media #{map-get(settings.$display-breakpoints, 'md-and-up')} {
    .card {
      flex-wrap: inherit;

      .card__title {
        font-size: 2rem;
      }

      .card__image {
        max-width: 300px;
        max-height: 100%;
        transition: transform 0.3s ease;
      }

      .card__text {
        padding: 3rem;
        width: 100%;
      }
    }
  }

  @media #{map-get(settings.$display-breakpoints, 'xs')} {
    .card__text {
      padding: 2rem 3.5rem;
    }

    .card__text:before {
      content: '';
      position: absolute;
      display: block;

      top: -20%;
      height: 130%;
      width: 55px;
    }
  }
</style>
