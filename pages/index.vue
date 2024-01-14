<script setup lang="ts">
  const { data: companies } = await useFetch('/api/company')

  const mainPartner = computed(
    () =>
      Object.values(companies.value).find(
        (company: any) => company.type === 'main-partner' && !!company.logo
      ) || null
  )

  const partners =
    computed(() =>
      Object.values(companies.value).filter(
        (company: any) => company.type === 'partner' && !!company.logo
      )
    ) || null
  const showPartners = computed(
    () => partners.value !== null && partners.value.length !== 0
  )

  const sponsors =
    computed(() =>
      Object.values(companies.value).filter(
        (company: any) => company.type === 'sponsor' && !!company.logo
      )
    ) || null
  const showSponsors = computed(
    () => sponsors.value !== null && sponsors.value.length !== 0
  )
</script>

<template>
  <div class="ma-10">
    <HomeBanner
      :content="{
        caption: 'Få et innblikk i din fremtidige arbeidsplass',
        date: { start: '2023-02-14', end: '2023-02-15' },
        image: 'https://cdn.vuetifyjs.com/images/parallax/material.jpg',
        title: 'Elektronikk & Teknologidagene',
      }"
    />
    <VContainer>
      <HomeCountDown
        :content="{
          futureDate: '2024-02-14',
          futureTime: '10:00:00',
        }"
      />
    </VContainer>

    <VContainer v-if="mainPartner">
      <h4 class="text-sm-h3 text-h4 font-weight-bold text-center pt-16 pb-4">
        {{ $t('company.main_partner') }}
      </h4>

      <VDivider class="pb-4" />

      <CompanyHero
        :content="{
          name: mainPartner.name,
          description: mainPartner.description,
          logo: mainPartner.logo,
          webpage: mainPartner.webpage,
        }"
        class="my-5 d-flex justify-center"
      />
    </VContainer>

    <VContainer v-if="showPartners">
      <h4 class="text-sm-h3 text-h4 font-weight-bold text-center pt-16 pb-4">
        {{ $t('company.partners') }}
      </h4>

      <VDivider class="pb-4" />

      <CommonGrid>
        <CompanyCard
          v-for="partner in partners"
          :key="partner.id"
          :content="{
            logo: partner.logo,
            webpage: partner.webpage,
          }"
        />
      </CommonGrid>
    </VContainer>

    <VContainer v-if="showSponsors">
      <h4 class="text-sm-h3 text-h4 font-weight-bold text-center pt-16 pb-4">
        {{ $t('company.sponsors') }}
      </h4>

      <VDivider class="pb-4" />

      <CommonGrid>
        <CompanyCard
          v-for="sponsor in sponsors"
          :key="sponsor.id"
          :content="{
            logo: sponsor.logo || '',
            webpage: sponsor.webpage,
          }"
        />
      </CommonGrid>
    </VContainer>
  </div>
</template>
