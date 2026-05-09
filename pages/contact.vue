<template>
  <div class="my-16">
    <h3 class="text-center mb-6">{{ $t('contact.title') }}</h3>
    <VContainer class="mb-6 px-md-12 d-none d-sm-block">
      <ContactCard
        class="mx-auto w-75"
        :content="{
          name: 'William Bryde',
          position: $t('contact.positions.business'),
          email: 'bedriftansvarlig@et-dagen.no',
          phone: '+47 995 41 223',
          image: '/images/board/business.jpg',
        }"
      />
    </VContainer>

    <h4 class="text-center">{{ $t('contact.board') }}</h4>
    <VContainer>
      <CommonGrid>
        <ContactGridCard
          :content="{
            name: 'Fredrik Sanner',
            position: $t('contact.positions.head'),
            email: 'leder@et-dagen.no',
            phone: '+47 412 89 452',
            image: '/images/board/manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Vegard Geirsson Ultveit',
            position: $t('contact.positions.deputyHead'),
            email: 'nestleder@et-dagen.no',
            phone: '+47 483 44 104',
            image: '/images/board/deputy_manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Eirik Hoel',
            position: $t('contact.positions.finance'),
            email: 'okonomi@et-dagen.no',
            phone: '+47 953 07 334',
            image: '/images/board/finance.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Even Cornelius Bjerke Gjerde',
            position: $t('contact.positions.logistics'),
            email: 'logistikk@et-dagen.no',
            phone: '+47 969 00 876',
            image: '/images/board/logistics.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'William Bryde',
            position: $t('contact.positions.business'),
            email: 'bedriftansvarlig@et-dagen.no',
            phone: '+47 995 41 223',
            image: '/images/board/business.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Ruben Johnsen',
            position: $t('contact.positions.spons'),
            email: 'spons@et-dagen.no',
            phone: '+47 469 44 567',
            image: '/images/board/sponsor.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Anna Lina Hollum',
            position: $t('contact.positions.marketing'),
            email: 'mfansvarlig@et-dagen.no',
            phone: '+47 977 47 450',
            image: '/images/board/marketing.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Selma Olsen Storbugt',
            position: $t('contact.positions.IT'),
            email: 'itansvarlig@et-dagen.no',
            phone: '+47 412 89 917',
            image: '/images/board/it.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Elias Møinichen Alsos',
            position: $t('contact.positions.travel'),
            email: 'turansvarlig@et-dagen.no',
            phone: '+47 941 74 073',
            image: '/images/board/travel.jpg',
          }"
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
      max-width: 900px !important;
    }
    @media #{map.get(settings.$display-breakpoints, 'sm')} {
      max-width: 600px !important;
    }
    @media #{map.get(settings.$display-breakpoints, 'xs')} {
      max-width: 350px !important;
    }
  }
</style>
