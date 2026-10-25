<script setup lang="ts">
  import CopyEmail from './CopyEmail.vue'
  import Portrait from './Portrait.vue'
  import type { ListedMember } from '@/contracts/board'

  defineProps<{ board: ListedMember[] }>()
  const { locale } = useI18n()
  const titleOf = (member: ListedMember) =>
    locale.value === 'en' ? member.title.en : member.title.nb
</script>

<template>
  <section aria-labelledby="board-heading" class="tw:flex tw:flex-col tw:gap-4">
    <h2
      id="board-heading"
      class="tw:text-2xl tw:font-extrabold tw:tracking-tight"
    >
      {{ $t('contact.board') }}
    </h2>
    <ul
      class="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-6 tw:sm:grid-cols-3 tw:lg:grid-cols-5"
    >
      <li
        v-for="member in board"
        :key="member.id"
        class="tw:flex tw:min-w-0 tw:flex-col tw:gap-1"
      >
        <Portrait :src="member.photoUrl" :name="member.name" class="tw:mb-2" />
        <p class="tw:text-sm tw:font-bold tw:text-brand">
          {{ titleOf(member) }}
        </p>
        <p class="tw:font-extrabold tw:leading-snug">{{ member.name }}</p>
        <CopyEmail :email="member.email" class="tw:text-sm" />
        <a
          v-if="member.phone"
          :href="`tel:${member.phone.replace(/\s/g, '')}`"
          class="tw:text-sm tw:text-muted-foreground tw:tabular-nums tw:hover:text-foreground"
        >
          {{ member.phone }}
        </a>
      </li>
    </ul>
  </section>
</template>
