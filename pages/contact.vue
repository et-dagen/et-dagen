<script setup lang="ts">
  import ContactCard, { type CardContent } from '@/components/contact/Card.vue'
  import ContactGridCard from '@/components/contact/GridCard.vue'
  import CommonGrid from '@/components/common/Grid.vue'
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
  <div class="my-16">
    <h3 class="text-center mb-6">{{ $t('contact.title') }}</h3>
    <VContainer v-if="featured" class="mb-6 px-md-12 d-none d-sm-block">
      <ContactCard class="mx-auto w-75" :content="cardOf(featured)" />
    </VContainer>

    <h4 class="text-center">{{ $t('contact.board') }}</h4>
    <VContainer>
      <CommonGrid>
        <ContactGridCard
          v-for="member in board"
          :key="member.id"
          :content="cardOf(member)"
        />
      </CommonGrid>
    </VContainer>
  </div>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .v-container {
    // Set different max-widths for different screen sizes
    @media #{map.get(settings.$display-breakpoints, 'md-and-up')} {
      max-width: 900px;
    }
    @media #{map.get(settings.$display-breakpoints, 'sm')} {
      max-width: 600px;
    }
    @media #{map.get(settings.$display-breakpoints, 'xs')} {
      max-width: 350px;
    }
  }
</style>
