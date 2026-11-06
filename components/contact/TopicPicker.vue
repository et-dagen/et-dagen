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
  <section aria-labelledby="topic-heading" class="flex flex-col gap-3">
    <h2
      id="topic-heading"
      class="text-2xl font-extrabold tracking-tight lg:text-[2rem]"
    >
      {{ $t('contact.question') }}
    </h2>
    <div
      role="tablist"
      :aria-label="$t('contact.question')"
      class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:border lg:bg-card"
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
        class="rounded-lg border bg-card px-3 py-3 text-sm font-bold transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset max-lg:last:odd:col-span-2 aria-selected:border-plate aria-selected:bg-plate aria-selected:text-plate-foreground lg:rounded-none lg:border-0 lg:border-l lg:py-3.5 lg:text-[15px] lg:first:border-l-0"
        @click="selected = index"
      >
        {{ $t(`contact.topics.${item.key}`) }}
      </button>
    </div>

    <Transition
      mode="out-in"
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-y-1"
      leave-active-class="transition duration-100 motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <div
        :id="`answer-${topic.key}`"
        :key="topic.key"
        role="tabpanel"
        :aria-labelledby="`topic-${topic.key}`"
        class="grid gap-5 rounded-lg border bg-card p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-8 sm:p-6"
      >
        <Portrait
          v-if="person"
          :src="person.photoUrl"
          :name="person.name"
          class="w-32 sm:w-48"
        />
        <div
          class="flex min-w-0 flex-col gap-2"
          :class="!person && 'sm:col-span-2'"
        >
          <p class="max-w-prose text-muted-foreground">
            {{ $t(`contact.answers.${topic.key}`) }}
          </p>
          <template v-if="person">
            <p class="mt-1 font-bold text-brand">
              {{ titleOf(person) }}
            </p>
            <p class="text-3xl leading-tight font-extrabold tracking-tight">
              {{ person.name }}
            </p>
          </template>
          <div class="mt-2 flex flex-col gap-2">
            <CopyEmail
              :email="person?.email ?? topic.email"
              labelled
              class="text-lg"
            />
            <a
              v-if="person?.phone"
              :href="`tel:${person.phone.replace(/\s/g, '')}`"
              class="inline-flex w-fit items-center gap-2 text-lg font-semibold tabular-nums hover:underline hover:underline-offset-4"
            >
              <Phone class="size-4" aria-hidden="true" />
              {{ person.phone }}
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>
