<script setup lang="ts">
  import type { PropType } from 'vue'

  export interface CardContent {
    name: string
    image: string | null
    position: string
    email: string
    phone?: string | null
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
      <img
        v-if="content.image"
        class="image"
        :src="content.image"
        :alt="content.name"
      />
      <div v-else class="image placeholder">
        <VIcon size="64">mdi-account</VIcon>
      </div>
      <div class="card-text pa-md-8 pa-sm-4">
        <div class="title bold text-primary py-3 text-md-h6">
          {{ content.position }}
        </div>
        <span class="text-md-h4 text-sm-h5 bold">{{ content.name }}</span>

        <div class="actions mt-md-6 mt-sm-3">
          <a :href="`mailto:${content.email}`">
            <VIcon>mdi-email</VIcon> {{ content.email }}
          </a>
          <a
            v-if="content.phone"
            :href="`tel:${content.phone.replace(/\s/g, '')}`"
          >
            <VIcon>mdi-phone</VIcon> {{ content.phone }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .bold {
    font-weight: bold;
  }

  .image {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  .placeholder {
    display: grid;
    place-items: center;
    background: rgb(var(--v-theme-neutral-lighten-4));
  }

  .v-icon {
    color: rgb(var(--v-theme-primary));
  }
  .card {
    aspect-ratio: 2 / 1;
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
    @media #{map.get(settings.$display-breakpoints, 'sm-and-up')} {
      max-width: 600px;
    }
    @media #{map.get(settings.$display-breakpoints, 'sm')} {
      width: 450px;
      .actions {
        font-size: 0.9rem;

        a {
          gap: 0.5rem;
        }
      }
    }
  }
</style>
