<script setup lang="ts">
  import Banner from '@/components/home/Banner.vue'
  import CountDown from '@/components/home/CountDown.vue'
  import CompanyCard from '@/components/company/Card.vue'
  import CompanyHero from '@/components/company/Hero.vue'
  import CommonGrid from '@/components/common/Grid.vue'
  import { Separator } from '@/components/ui/separator'
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
  <div class="tw:m-10 tw:text-black/87">
    <Banner
      :content="{
        caption: $t('home.banner.slogan'),
        dates,
        image: '/images/banner_graphics.png',
        title: 'Elektronikk & Teknologidagene',
      }"
      class="tw:my-4 tw:flex tw:justify-center tw:min-[2560px]:my-16"
    />

    <CountDown :start="start" class="tw:mb-5" />

    <p
      v-if="lineup.last"
      class="tw:pt-10 tw:text-center tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
    >
      {{ $t('home.companies_last') }}
    </p>

    <div v-if="lineup.mainPartner" class="tw:py-10">
      <h2
        class="tw:pt-10 tw:pb-4 tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-bold tw:tracking-[0.0073em] tw:min-[960px]:text-5xl tw:min-[960px]:leading-[1.05] tw:min-[960px]:tracking-normal"
      >
        {{ $t('company.main_partner') }}
      </h2>
      <Separator
        class="tw:mx-auto tw:mb-3 tw:max-w-[1000px] tw:bg-black/10 tw:data-[orientation=horizontal]:h-0.5 tw:min-[1280px]:mb-8"
      />
      <CompanyHero
        :content="{
          name: lineup.mainPartner.name ?? '',
          description: lineup.mainPartner.description ?? '',
          logo: lineup.mainPartner.logo ?? '',
          webpage: lineup.mainPartner.webpage ?? '',
        }"
        class="tw:mb-3 tw:flex tw:justify-center tw:pt-3"
      />
    </div>

    <div v-if="lineup.partners.length" class="tw:py-10">
      <h2
        class="tw:pt-10 tw:pb-4 tw:text-center tw:text-5xl tw:leading-[1.05] tw:font-bold"
      >
        {{ $t('company.partners') }}
      </h2>
      <Separator
        class="tw:mx-auto tw:mb-3 tw:max-w-[1000px] tw:bg-black/10 tw:data-[orientation=horizontal]:h-0.5 tw:min-[1280px]:mb-8"
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

    <div v-if="lineup.sponsors.length" class="tw:pt-10">
      <h2
        class="tw:pt-10 tw:pb-4 tw:text-center tw:text-5xl tw:leading-[1.05] tw:font-bold"
      >
        {{ $t('company.sponsors') }}
      </h2>
      <Separator
        class="tw:mx-auto tw:mb-3 tw:max-w-[1000px] tw:bg-black/10 tw:data-[orientation=horizontal]:h-0.5 tw:min-[1280px]:mb-8"
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
