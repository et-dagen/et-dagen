<script setup lang="ts">
  export interface ContactCardContent {
    name: string
    email: string
    position: string
    phone?: string
    image: string
  }

  defineProps({
    content: {
      type: Object as PropType<ContactCardContent>,
      required: true,
    },
  })
</script>

<template>
  <div class="card">
    <NuxtImg class="card__image" :src="content.image" />
    <span class="text-primary semibold">{{ content.position }}</span>
    <span class="card__name bold">{{ content.name }}</span>
    <div class="actions d-flex flex-column">
      <p>
        <a :href="`mailto:${content.email}`" class="text-accent bold">
          {{ content.email }}
        </a>
      </p>
      <p>
        <a v-if="content.phone" :href="`tel:${content.phone}`">
          {{ content.phone }}
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .semibold {
    font-weight: 600;
  }

  .bold {
    font-weight: bold;
  }

  .card {
    margin: 0 !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    aspect-ratio: 15 / 3 !important;
    max-width: 250px;
    min-width: 200px;
    padding: 12px;

    &__image {
      width: 100%;
      padding: 6px;
      border-radius: 12px;
      aspect-ratio: 1 / 1.2 !important;
      object-fit: cover;
    }

    &__name {
      font-size: 1.1rem !important;
    }

    .actions {
      gap: 0.25rem;
    }

    span,
    a {
      font-size: 0.9rem;
      color: var(--color-text-neutral);
    }
  }
</style>
