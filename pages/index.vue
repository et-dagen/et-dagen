<script setup lang="ts">
  const { data: companies } = await useFetch('/api/company')

  const mainSponsor: any = computed(() =>
    Object.values(companies.value).find((el: any) => el.type === 'main-sponsor')
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
      :content="{
        name: mainSponsor.name,
        description: mainSponsor.description,
        logo: mainSponsor.logo,
        website: mainSponsor.website,
      }"
      class="my-5 d-flex justify-center"
    />

    <CompanyGrid>
      <CompanyCard
        :content="{
          logo: `https://1000logos.net/wp-content/
          uploads/2021/05/Sony-logo.png`,
          website: 'https://pro.sony/en_NO/home',
        }"
      ></CompanyCard>
    </CompanyGrid>
  </div>
</template>
