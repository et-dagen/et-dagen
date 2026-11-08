<script setup lang="ts">
  import Banner from '@/components/home/Banner.vue'
  import CountDown from '@/components/home/CountDown.vue'
  import CompanyCard from '@/components/company/Card.vue'
  import CompanyHero from '@/components/company/Hero.vue'
  import CommonGrid from '@/components/common/Grid.vue'
  import { useCompanies } from '@/composables/useCompanies'
  import { lineupOf } from '@/lib/site/companies'
  import { fairDateLine, type GeneralInfo } from '@/lib/site/fair'
  import { instantOf } from '@/lib/time'

  const { locale } = useI18n()

  const [{ data: companies }, { data: info }] = await Promise.all([
    useCompanies(),
    useFetch<GeneralInfo>('/api/v1/generalInfo'),
  ])

  const lineup = computed(() => lineupOf(companies.value, { order: 'stored' }))
  const dates = computed(() => fairDateLine(info.value, locale.value))
  const start = computed(() => instantOf(info.value?.date?.start))
</script>

<template>
  <div class="ma-10">
    <Banner
      :content="{
        caption: $t('home.banner.slogan'),
        dates,
        image: '/images/banner_graphics.png',
        title: 'Elektronikk & Teknologidagene',
      }"
      class="my-4 my-xxl-16 d-flex justify-center"
    />

    <CountDown :start="start" class="mb-5" />

    <p v-if="lineup.last" class="text-h6 text-center pt-10">
      {{ $t('home.companies_last') }}
    </p>

    <div v-if="lineup.mainPartner" class="py-10">
      <h2 class="text-h4 text-md-h3 text-center pt-10 pb-4 font-weight-bold">
        {{ $t('company.main_partner') }}
      </h2>
      <VDivider
        class="pb-lg-8 pb-3 mx-auto"
        style="width: 100%; max-width: 1000px"
      />
      <CompanyHero
        :content="{
          name: lineup.mainPartner.name ?? '',
          description: lineup.mainPartner.description ?? '',
          logo: lineup.mainPartner.logo ?? '',
          webpage: lineup.mainPartner.webpage ?? '',
        }"
        class="my-3 d-flex justify-center"
      />
    </div>

    <div v-if="lineup.partners.length" class="py-10">
      <h2 class="text-h3 text-center pt-10 pb-4 font-weight-bold">
        {{ $t('company.partners') }}
      </h2>
      <VDivider
        class="pb-lg-8 pb-3 mx-auto"
        style="width: 100%; max-width: 1000px"
      />
      <CommonGrid>
        <CompanyCard
          v-for="partner in lineup.partners"
          :key="partner.name"
          :content="{
            logo: partner.logo ?? '',
            webpage: partner.webpage ?? '',
          }"
        />
      </CommonGrid>
    </div>

    <div v-if="lineup.sponsors.length" class="pt-10">
      <h2 class="text-h3 text-center pt-10 pb-4 font-weight-bold">
        {{ $t('company.sponsors') }}
      </h2>
      <VDivider
        class="pb-lg-8 pb-3 mx-auto"
        style="width: 100%; max-width: 1000px"
      />
      <CommonGrid>
        <CompanyCard
          v-for="sponsor in lineup.sponsors"
          :key="sponsor.name"
          :content="{
            logo: sponsor.logo ?? '',
            webpage: sponsor.webpage ?? '',
          }"
        />
      </CommonGrid>
    </div>
  </div>
</template>
