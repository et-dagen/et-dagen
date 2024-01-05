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
  <div class="card elevation-3">
    <div class="card-content">
      <img class="image" :src="content.image" />
      <div class="card-text pa-md-8 pa-sm-4">
        <div class="title bold text-primary py-3 text-md-h6">
          {{ content.position }}
        </div>
        <span class="text-md-h4 text-sm-h5 bold">{{ content.name }}</span>

        <div class="actions mt-md-6 mt-sm-3">
          <NuxtLink :to="`mailto:${content.email}`">
            <VIcon>mdi-email</VIcon> {{ content.email }}
          </NuxtLink>
          <NuxtLink v-if="content.phone" :to="`tel:${content.phone}`">
            <VIcon>mdi-phone</VIcon> {{ content.phone }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';
  .bold {
    font-weight: bold;
  }

  .v-icon {
    color: rgb(var(--v-theme-primary));
  }
  .card {
    aspect-ratio: 2 / 1 !important;
    display: flex;
    flex-direction: row;
    border-radius: 24px;
    overflow: hidden;

    &-content {
      display: grid;
      width: 100%;
      height: 100%;
      grid-template-columns: 1fr 2fr;
      position: relative;
      overflow: hidden;

      .image {
        width: 100%;
        height: 100% !important;
        margin: 0;
        // max-height: 100%;
        object-fit: cover;
        overflow: hidden;
      }

      .actions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        a {
          display: flex;
          flex-direction: row;
          gap: 1rem;
          align-items: center;
        }
      }
    }

    // Set different max-widths for different screen sizes
    @media #{map-get(settings.$display-breakpoints, 'sm-and-up')} {
      max-width: 600px !important;
    }
    @media #{map-get(settings.$display-breakpoints, 'sm')} {
      width: 450px !important;
      .actions {
        font-size: 0.9rem !important;

        a {
          gap: 0.5rem;
        }
      }
    }
  }
</style>
