<script setup lang="ts">
  const { data: companies } = await useFetch('/api/company')

  const mainPartner = computed(
    () =>
      Object.values(companies.value).find(
        (company: any) => company.type === 'main-partner'
      ) || null
  )

  const partners =
    computed(() =>
      Object.values(companies.value).filter(
        (company: any) => company.type === 'partner'
      )
    ) || null
  const showPartners = computed(
    () => partners.value !== null && partners.value.length !== 0
  )

  const sponsors =
    computed(() =>
      Object.values(companies.value).filter(
        (company: any) => company.type === 'sponsor'
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

    <CompanyHero
      v-if="mainPartner !== null"
      :content="{
        name: mainPartner.name,
        description: mainPartner.description,
        logo: mainPartner.logo,
        website: mainPartner.website,
      }"
      class="my-5 d-flex justify-center"
    />

    <div v-if="showPartners">
      <h2
        :class="`text-sm-h3 text-h4 text-center 
          pt-10 pb-lg-6 pb-3 font-weight-bold`"
      >
        {{ $t('company.partners') }}
      </h2>
      <CompanyGrid>
        <CompanyCard
          v-for="partner in partners"
          :key="partner.id"
          :content="{
            logo: partner.logo,
            website: partner.website,
          }"
        />
      </CompanyGrid>
    </div>

    <div v-if="showSponsors">
      <h2
        :class="`text-sm-h3 text-h4 text-center 
          pt-10 pb-lg-6 pb-3 font-weight-bold`"
      >
        {{ $t('company.sponsors') }}
      </h2>
      <CompanyGrid>
        <CompanyCard
          v-for="sponsor in sponsors"
          :key="sponsor.id"
          :content="{
            logo: sponsor.logo || '',
            website: sponsor.website,
          }"
        />
      </CompanyGrid>
    </div>
  </div>
</template>
