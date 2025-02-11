<script setup lang="ts">
  const { data: companies } = await useFetch('/api/company')
  const { data: info } = await useFetch('/api/generalInfo')

  const mainPartner = computed(
    () =>
      Object.values(companies.value).find(
        (company: any) => company.type === 'main-partner' && !!company.logo,
      ) || null,
  )

  const partners =
    computed(() =>
      Object.values(companies.value).filter(
        (company: any) => company.type === 'partner' && !!company.logo,
      ),
    ) || null

  const showPartners = computed(
    () => partners.value !== null && partners.value.length !== 0,
  )

  const sponsors =
    computed(() =>
      Object.values(companies.value).filter(
        (company: any) => company.type === 'sponsor' && !!company.logo,
      ),
    ) || null
  const showSponsors = computed(
    () => sponsors.value !== null && sponsors.value.length !== 0,
  )

  const date = computed(() => {
    // Default date if no date is found
    const endDateString = info.value?.date?.end ?? '2024-02-10T10:00:00'
    const startDateString = info.value?.date?.start ?? '2024-02-13T10:00:00'
    const timeString = info.value?.date?.start ?? '2024-02-01T10:00:00'

    const endDate = new Date(endDateString).toISOString().split('T')[0]
    const startDate = new Date(startDateString).toISOString().split('T')[0]
    const time = new Date(timeString).toISOString().split('T')[1].split('.')[0]

    return {
      end: endDate, // yyyy-mm-dd
      start: startDate, // yyyy-mm-dd
      time, // hh:mm:ss
    }
  })
</script>

<template>
  <div class="ma-10">
    <HomeBanner
      :content="{
        caption: $t('home.banner.slogan'),
        date: { start: date.start, end: date.end },

        image: '/images/banner_graphics.png',
        title: 'Elektronikk & Teknologidagene',
      }"
      class="my-4 my-xxl-16 d-flex justify-center"
    />

    <HomeCountDown
      :content="{
        futureDate: date.start,
        futureTime: date.time,
      }"
      class="mb-5"
    />

    <div v-if="mainPartner !== null" class="py-10">
      <h2 class="text-h4 text-md-h3 text-center pt-10 pb-4 font-weight-bold">
        {{ $t('company.main_partner') }}
      </h2>
      <VDivider
        class="pb-lg-8 pb-3 mx-auto"
        style="width: 100%; max-width: 1000px"
      />
      <CompanyHero
        :content="{
          name: mainPartner.name,
          description: mainPartner.description,
          logo: mainPartner.logo,
          webpage: mainPartner.webpage,
        }"
        class="my-3 d-flex justify-center"
      />
    </div>

    <div v-if="showPartners" class="py-10">
      <h2 class="text-h3 text-center pt-10 pb-4 font-weight-bold">
        {{ $t('company.partners') }}
      </h2>
      <VDivider
        class="pb-lg-8 pb-3 mx-auto"
        style="width: 100%; max-width: 1000px"
      />
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
    </div>

    <div v-if="showSponsors" class="pt-10">
      <h2 class="text-h3 text-center pt-10 pb-4 font-weight-bold">
        {{ $t('company.sponsors') }}
      </h2>
      <VDivider
        class="pb-lg-8 pb-3 mx-auto"
        style="width: 100%; max-width: 1000px"
      />
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
    </div>
  </div>
</template>
