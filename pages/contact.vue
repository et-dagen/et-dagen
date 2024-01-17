<template>
  <div class="my-16">
    <h3 class="text-center mb-6">{{ $t('contact.title') }}</h3>
    <VContainer class="mb-6 px-md-12 d-none d-sm-block">
      <ContactCard
        class="mx-auto w-75"
        :content="{
          name: 'Marius Liebig',
          position: $t('contact.positions.business'),
          email: 'bedriftansvarlig@et-dagen.no',
          phone: '+47 923 13 055',
          image: '/images/board/business.jpg',
        }"
      />
    </VContainer>

    <VContainer>
      <h4 class="d-none d-sm-block font-weight-bold text-center pt-8 pb-4">
        {{ $t('contact.board') }}
      </h4>

      <VDivider class="pb-4" />

      <CommonGrid>
        <ContactGridCard
          :content="{
            name: 'Sara Stokke Aursand',
            position: $t('contact.positions.head'),
            email: 'leder@et-dagen.no',
            phone: '+47 918 00 396',
            image: '/images/board/manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Cecilie Von Krogh Fagtun',
            position: $t('contact.positions.deputyHead'),
            email: 'nestleder@et-dagen.no',
            phone: '+47 455 07 633',
            image: '/images/board/deputy_manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Tord Sætermo',
            position: $t('contact.positions.finance'),
            email: 'okonomi@et-dagen.no',
            phone: '+47 412 77 747',
            image: '/images/board/finance.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Anita Bueno Lindmoen',
            position: $t('contact.positions.logistics'),
            email: 'logistikk@et-dagen.no',
            phone: '+47 483 63 109',
            image: '/images/board/logistics.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Marius Liebig',
            position: $t('contact.positions.business'),
            email: 'bedriftansvarlig@et-dagen.no',
            phone: '+47 923 13 055',
            image: '/images/board/business.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Håvard Lundheim',
            position: $t('contact.positions.spons'),
            email: 'spons@et-dagen.no',
            phone: '+47 977 83 216',
            image: '/images/board/sponsor.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Anetta Lyche Knudsen',
            position: $t('contact.positions.marketing'),
            email: 'mfansvarlig@et-dagen.no',
            phone: '+47 953 02 740',
            image: '/images/board/marketing.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Ian Philip Eglin',
            position: $t('contact.positions.IT'),
            email: 'itansvarlig@et-dagen.no',
            phone: '+47 970 85 256',
            image: '/images/board/it.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Josh Jude',
            position: $t('contact.positions.travel'),
            email: 'turansvarlig@et-dagen.no',
            phone: '+47 459 24 469',
            image: '/images/board/travel.jpg',
          }"
        />
      </CommonGrid>
    </VContainer>
  </div>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';
  .v-container {
    // Set different max-widths for different screen sizes
    @media #{map-get(settings.$display-breakpoints, 'md-and-up')} {
      max-width: 900px !important;
    }
    @media #{map-get(settings.$display-breakpoints, 'sm')} {
      max-width: 600px !important;
    }
    @media #{map-get(settings.$display-breakpoints, 'xs')} {
      max-width: 350px !important;
    }
  }
</style>
