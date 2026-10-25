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
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:gap-10 tw:px-4 tw:py-8 tw:lg:px-8 tw:lg:py-12"
    >
      <h1
        class="tw:text-3xl tw:font-extrabold tw:tracking-tight tw:lg:text-[2.5rem]"
      >
        {{ $t('contact.title') }}
      </h1>
      <TopicPicker v-model:selected="topic" :board="board ?? []" />
      <BoardGrid v-if="board?.length" :board="board" :answering="answering" />

      <section
        :aria-label="$t('contact.organisation')"
        class="tw:flex tw:flex-col tw:gap-4 tw:border-t tw:pt-6 tw:text-sm tw:sm:flex-row tw:sm:flex-wrap tw:sm:gap-x-10"
      >
        <p>
          <span class="tw:block tw:font-bold">{{ ORGANISATION.name }}</span>
          <span class="tw:text-muted-foreground">{{
            ORGANISATION.address
          }}</span>
        </p>
        <p>
          <span class="tw:block tw:font-bold">{{
            $t('contact.org_number')
          }}</span>
          <span class="tw:text-muted-foreground tw:tabular-nums">{{
            ORGANISATION.orgNumber
          }}</span>
        </p>
        <div>
          <span class="tw:block tw:font-bold">{{ $t('contact.follow') }}</span>
          <ul class="tw:flex tw:gap-4">
            <li v-for="link in ORGANISATION.social" :key="link.name">
              <a
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="tw:text-muted-foreground tw:underline tw:underline-offset-4 tw:hover:text-foreground"
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
