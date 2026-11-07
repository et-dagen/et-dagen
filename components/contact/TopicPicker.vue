<script setup lang="ts">
  import { Phone } from '@lucide/vue'
  import CopyEmail from './CopyEmail.vue'
  import Portrait from './Portrait.vue'
  import type { ListedMember } from '@/contracts/board'
  import { answerFor, CONTACT_TOPICS } from '@/lib/contact/topics'

  const props = defineProps<{ board: ListedMember[] }>()
  /** The chosen topic's place in the list; the board marks who answers it */
  const selected = defineModel<number>('selected', { default: 0 })

  const { locale } = useI18n()
  const topic = computed(() => CONTACT_TOPICS[selected.value]!)
  const person = computed(() => answerFor(topic.value, props.board))
  const titleOf = (member: ListedMember) =>
    locale.value === 'en' ? member.title.en : member.title.nb

  // a tab list: the arrow keys move between topics, as screen readers expect
  async function move(by: number) {
    const count = CONTACT_TOPICS.length
    selected.value = (selected.value + by + count) % count
    await nextTick()
    document.getElementById(`topic-${topic.value.key}`)?.focus()
  }
</script>

<template>
  <section aria-labelledby="topic-heading" class="tw:flex tw:flex-col tw:gap-3">
    <h2
      id="topic-heading"
      class="tw:text-2xl tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem]"
    >
      {{ $t('contact.question') }}
    </h2>
    <div
      role="tablist"
      :aria-label="$t('contact.question')"
      class="tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:grid-cols-3 tw:lg:grid-cols-5 tw:lg:gap-0 tw:lg:overflow-hidden tw:lg:rounded-lg tw:lg:border tw:lg:bg-card"
      @keydown.right.prevent="move(1)"
      @keydown.left.prevent="move(-1)"
    >
      <button
        v-for="(item, index) in CONTACT_TOPICS"
        :id="`topic-${item.key}`"
        :key="item.key"
        type="button"
        role="tab"
        :aria-selected="index === selected"
        :aria-controls="`answer-${item.key}`"
        :tabindex="index === selected ? 0 : -1"
        class="tw:rounded-lg tw:border tw:bg-card tw:px-3 tw:py-3 tw:text-sm tw:font-bold tw:transition-colors tw:outline-none tw:hover:bg-muted tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-inset tw:max-lg:last:odd:col-span-2 tw:aria-selected:border-plate tw:aria-selected:bg-plate tw:aria-selected:text-plate-foreground tw:lg:rounded-none tw:lg:border-0 tw:lg:border-l tw:lg:py-3.5 tw:lg:text-[15px] tw:lg:first:border-l-0"
        @click="selected = index"
      >
        {{ $t(`contact.topics.${item.key}`) }}
      </button>
    </div>

    <Transition
      mode="out-in"
      enter-active-class="tw:transition tw:duration-200 tw:ease-out tw:motion-reduce:transition-none"
      enter-from-class="tw:opacity-0 tw:translate-y-1"
      leave-active-class="tw:transition tw:duration-100 tw:motion-reduce:transition-none"
      leave-to-class="tw:opacity-0"
    >
      <div
        :id="`answer-${topic.key}`"
        :key="topic.key"
        role="tabpanel"
        :aria-labelledby="`topic-${topic.key}`"
        class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:sm:grid-cols-[12rem_minmax(0,1fr)] tw:sm:items-center tw:sm:gap-8 tw:sm:p-6"
      >
        <Portrait
          v-if="person"
          :src="person.photoUrl"
          :name="person.name"
          class="tw:w-32 tw:sm:w-48"
        />
        <div
          class="tw:flex tw:min-w-0 tw:flex-col tw:gap-2"
          :class="!person && 'tw:sm:col-span-2'"
        >
          <p class="tw:max-w-prose tw:text-muted-foreground">
            {{ $t(`contact.answers.${topic.key}`) }}
          </p>
          <template v-if="person">
            <p class="tw:mt-1 tw:font-bold tw:text-brand">
              {{ titleOf(person) }}
            </p>
            <p
              class="tw:text-3xl tw:leading-tight tw:font-extrabold tw:tracking-tight"
            >
              {{ person.name }}
            </p>
          </template>
          <div class="tw:mt-2 tw:flex tw:flex-col tw:gap-2">
            <CopyEmail
              :email="person?.email ?? topic.email"
              labelled
              class="tw:text-lg"
            />
            <a
              v-if="person?.phone"
              :href="`tel:${person.phone.replace(/\s/g, '')}`"
              class="tw:inline-flex tw:w-fit tw:items-center tw:gap-2 tw:text-lg tw:font-semibold tw:tabular-nums tw:hover:underline tw:hover:underline-offset-4"
            >
              <Phone class="tw:size-4" aria-hidden="true" />
              {{ person.phone }}
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>
