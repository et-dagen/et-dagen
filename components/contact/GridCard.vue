<script setup lang="ts">
  import type { PropType } from 'vue'
  import { User } from '@lucide/vue'
  import { Card } from '@/components/ui/card'
  import type { CardContent } from '@/components/contact/Card.vue'

  defineProps({
    content: {
      type: Object as PropType<CardContent>,
      required: true,
    },
  })
</script>

<template>
  <Card
    class="tw:m-0 tw:max-w-[250px] tw:min-w-[200px] tw:items-center tw:gap-0 tw:rounded-[4px] tw:border-0 tw:p-3 tw:text-center tw:shadow-none"
  >
    <img
      v-if="content.image"
      class="tw:aspect-[1/1.2] tw:w-full tw:rounded-[12px] tw:object-cover tw:p-1.5"
      :src="content.image"
      :alt="content.name"
      loading="lazy"
    />
    <div
      v-else
      class="tw:grid tw:aspect-[1/1.2] tw:w-full tw:place-items-center tw:rounded-[12px] tw:bg-[#F5F5F5] tw:bg-clip-content tw:p-1.5"
    >
      <User class="tw:size-16" />
    </div>
    <span
      class="tw:text-[0.9rem] tw:leading-normal tw:font-semibold tw:text-brand"
    >
      {{ content.position }}
    </span>
    <span class="tw:text-[1.1rem] tw:leading-normal tw:font-bold">
      {{ content.name }}
    </span>
    <div class="tw:flex tw:flex-col tw:gap-1">
      <p>
        <a
          :href="`mailto:${content.email}`"
          class="tw:text-[0.9rem] tw:font-bold tw:text-[#C33C3B]"
        >
          {{ content.email }}
        </a>
      </p>
      <p>
        <a
          v-if="content.phone"
          class="tw:text-[0.9rem]"
          :href="`tel:${content.phone.replace(/\s/g, '')}`"
        >
          {{ content.phone }}
        </a>
      </p>
    </div>
  </Card>
</template>
