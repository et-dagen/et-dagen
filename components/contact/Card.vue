<script setup lang="ts">
  import type { PropType } from 'vue'
  import { Mail, Phone, User } from '@lucide/vue'
  import { Card } from '@/components/ui/card'

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
  <Card
    class="tw:aspect-[2/1] tw:max-w-[600px] tw:flex-row tw:gap-0 tw:overflow-hidden tw:rounded-[24px] tw:border-0 tw:py-0 tw:shadow-md"
  >
    <div class="tw:grid tw:size-full tw:grid-cols-[1fr_2fr] tw:overflow-hidden">
      <img
        v-if="content.image"
        class="tw:size-full tw:object-cover"
        :src="content.image"
        :alt="content.name"
      />
      <div
        v-else
        class="tw:grid tw:size-full tw:place-items-center tw:bg-[#F5F5F5]"
      >
        <User class="tw:size-16 tw:text-brand" />
      </div>
      <div class="tw:p-4 tw:min-[960px]:p-8">
        <div
          class="tw:py-3 tw:font-bold tw:text-brand tw:min-[960px]:text-[1.25rem] tw:min-[960px]:leading-[2rem] tw:min-[960px]:tracking-[0.0125em]"
        >
          {{ content.position }}
        </div>
        <span
          class="tw:text-[1.5rem] tw:leading-[1.333] tw:font-bold tw:min-[960px]:text-[2.125rem] tw:min-[960px]:leading-[1.175] tw:min-[960px]:tracking-[0.0073529412em]"
        >
          {{ content.name }}
        </span>

        <div
          class="tw:mt-3 tw:flex tw:flex-col tw:items-start tw:gap-4 tw:text-[0.9rem] tw:min-[960px]:mt-6 tw:min-[960px]:text-base"
        >
          <a
            class="tw:flex tw:items-center tw:gap-2 tw:min-[960px]:gap-4"
            :href="`mailto:${content.email}`"
          >
            <Mail class="tw:size-[1.5em] tw:shrink-0 tw:text-brand" />
            {{ content.email }}
          </a>
          <a
            v-if="content.phone"
            class="tw:flex tw:items-center tw:gap-2 tw:min-[960px]:gap-4"
            :href="`tel:${content.phone.replace(/\s/g, '')}`"
          >
            <Phone class="tw:size-[1.5em] tw:shrink-0 tw:text-brand" />
            {{ content.phone }}
          </a>
        </div>
      </div>
    </div>
  </Card>
</template>
