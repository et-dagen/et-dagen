<script setup lang="ts">
  import ContactCard, { type CardContent } from '@/components/contact/Card.vue'
  import ContactGridCard from '@/components/contact/GridCard.vue'
  import type { ListedMember } from '@/contracts/board'

  const { t, locale } = useI18n()
  const { data: board } = await useFetch<ListedMember[]>('/api/v1/board')
  useHead({ title: () => t('contact.title') })

  const cardOf = (member: ListedMember): CardContent => ({
    name: member.name,
    position: locale.value === 'en' ? member.title.en : member.title.nb,
    email: member.email,
    phone: member.phone,
    image: member.photoUrl,
  })
  const featured = computed(() =>
    board.value?.find((member) => member.featured),
  )
</script>

<template>
  <div class="tw:my-16">
    <h3
      class="tw:mb-6 tw:text-center tw:text-[3rem] tw:leading-[1.05] tw:font-normal"
    >
      {{ $t('contact.title') }}
    </h3>
    <div
      v-if="featured"
      class="tw:mx-auto tw:mb-6 tw:hidden tw:w-full tw:p-4 tw:min-[600px]:block tw:min-[600px]:max-w-[600px] tw:min-[960px]:max-w-[900px] tw:min-[960px]:px-12"
    >
      <ContactCard class="tw:mx-auto tw:w-3/4" :content="cardOf(featured)" />
    </div>

    <h4
      class="tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-normal tw:tracking-[0.0073529412em]"
    >
      {{ $t('contact.board') }}
    </h4>
    <div
      class="tw:mx-auto tw:w-full tw:max-w-[350px] tw:p-4 tw:min-[600px]:max-w-[600px] tw:min-[960px]:max-w-[900px]"
    >
      <div
        class="tw:mx-auto tw:flex tw:max-w-[65vw] tw:flex-wrap tw:justify-center tw:gap-x-4 tw:gap-y-6 tw:min-[600px]:max-w-[600px] tw:min-[600px]:gap-x-12 tw:min-[600px]:gap-y-16 tw:min-[960px]:max-w-[1000px]"
      >
        <ContactGridCard
          v-for="member in board"
          :key="member.id"
          :content="cardOf(member)"
        />
      </div>
    </div>
  </div>
</template>
