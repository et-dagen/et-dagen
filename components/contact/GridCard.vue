<script setup lang="ts">
  import type { PropType } from 'vue'
  import type { CardContent } from '@/components/contact/Card.vue'

  defineProps({
    content: {
      type: Object as PropType<CardContent>,
      required: true,
    },
  })
</script>

<template>
  <VCard flat class="card">
    <img
      v-if="content.image"
      class="card__image"
      :src="content.image"
      :alt="content.name"
      loading="lazy"
    />
    <div v-else class="card__image card__placeholder">
      <VIcon size="64">mdi-account</VIcon>
    </div>
    <span class="text-primary semibold">{{ content.position }}</span>
    <span class="card__name bold">{{ content.name }}</span>
    <div class="actions d-flex flex-column">
      <p>
        <a :href="`mailto:${content.email}`" class="text-accent bold">
          {{ content.email }}
        </a>
      </p>
      <p>
        <a
          v-if="content.phone"
          :href="`tel:${content.phone.replace(/\s/g, '')}`"
        >
          {{ content.phone }}
        </a>
      </p>
    </div>
  </VCard>
</template>

<style scoped lang="scss">
  .semibold {
    font-weight: 600;
  }

  .bold {
    font-weight: bold;
  }

  .card {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 250px;
    min-width: 200px;
    padding: 12px;

    &__image {
      width: 100%;
      padding: 6px;
      border-radius: 12px;
      aspect-ratio: 1 / 1.2;
      object-fit: cover;
    }

    &__placeholder {
      display: grid;
      place-items: center;
      background: rgb(var(--v-theme-neutral-lighten-4));
      background-clip: content-box;
    }

    .actions {
      gap: 0.25rem;
    }

    span,
    a {
      font-size: 0.9rem;
      color: var(--color-text-neutral);
    }

    .card__name {
      font-size: 1.1rem;
    }
  }
</style>
