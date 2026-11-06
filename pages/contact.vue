<script setup lang="ts">
  import BoardGrid from '@/components/contact/BoardGrid.vue'
  import TopicPicker from '@/components/contact/TopicPicker.vue'
  import type { ListedMember } from '@/contracts/board'
  import { answerFor, CONTACT_TOPICS, ORGANISATION } from '@/lib/contact/topics'

  const { t } = useI18n()
  const { data: board } = await useFetch<ListedMember[]>('/api/v1/board')
  const topic = ref(0)
  const answering = computed(
    () => answerFor(CONTACT_TOPICS[topic.value]!, board.value)?.id ?? null,
  )
  useHead({ title: () => t('contact.title') })
</script>

<template>
  <div class="et-ui">
    <div
      class="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 lg:px-8 lg:py-12"
    >
      <h1 class="text-3xl font-extrabold tracking-tight lg:text-[2.5rem]">
        {{ $t('contact.title') }}
      </h1>
      <TopicPicker v-model:selected="topic" :board="board ?? []" />
      <BoardGrid v-if="board?.length" :board="board" :answering="answering" />

      <section
        :aria-label="$t('contact.organisation')"
        class="flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:flex-wrap sm:gap-x-10"
      >
        <p>
          <span class="block font-bold">{{ ORGANISATION.name }}</span>
          <span class="text-muted-foreground">{{ ORGANISATION.address }}</span>
        </p>
        <p>
          <span class="block font-bold">{{ $t('contact.org_number') }}</span>
          <span class="text-muted-foreground tabular-nums">{{
            ORGANISATION.orgNumber
          }}</span>
        </p>
        <div>
          <span class="block font-bold">{{ $t('contact.follow') }}</span>
          <ul class="flex gap-4">
            <li v-for="link in ORGANISATION.social" :key="link.name">
              <a
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
