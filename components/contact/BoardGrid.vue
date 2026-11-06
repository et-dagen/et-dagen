<script setup lang="ts">
  import CopyEmail from './CopyEmail.vue'
  import Portrait from './Portrait.vue'
  import type { ListedMember } from '@/contracts/board'

  defineProps<{
    board: ListedMember[]
    /** The member who answers the topic chosen above, marked in E&T red */
    answering: string | null
  }>()
  const { locale } = useI18n()
  const titleOf = (member: ListedMember) =>
    locale.value === 'en' ? member.title.en : member.title.nb
</script>

<template>
  <section aria-labelledby="board-heading" class="flex flex-col gap-4">
    <h2 id="board-heading" class="text-2xl font-extrabold tracking-tight">
      {{ $t('contact.board') }}
    </h2>
    <ul class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      <li
        v-for="member in board"
        :key="member.id"
        :aria-current="member.id === answering ? 'true' : undefined"
        class="group flex min-w-0 flex-col gap-1"
      >
        <Portrait
          :src="member.photoUrl"
          :name="member.name"
          class="mb-2 outline-3 outline-offset-3 outline-transparent transition-[outline-color] duration-200 group-aria-[current=true]:outline-brand"
        />
        <p class="text-sm font-bold text-brand">
          {{ titleOf(member) }}
        </p>
        <p class="font-extrabold leading-snug">{{ member.name }}</p>
        <CopyEmail :email="member.email" class="text-sm" />
        <a
          v-if="member.phone"
          :href="`tel:${member.phone.replace(/\s/g, '')}`"
          class="text-sm text-muted-foreground tabular-nums hover:text-foreground"
        >
          {{ member.phone }}
        </a>
      </li>
    </ul>
  </section>
</template>
