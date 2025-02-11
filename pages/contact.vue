<template>
  <div class="my-16">
    <h3 class="text-center mb-6">{{ $t('contact.title') }}</h3>
    <VContainer class="mb-6 px-md-12 d-none d-sm-block">
      <ContactCard
        class="mx-auto w-75"
        :content="{
          name: 'Andrea Gladhaug',
          position: $t('contact.positions.business'),
          email: 'bedriftansvarlig@et-dagen.no',
          phone: '+47 489 58 605',
          image: '/images/board/business.jpg',
        }"
      />
    </VContainer>

    <h4 class="text-center">{{ $t('contact.board') }}</h4>
    <VContainer>
      <CommonGrid>
        <ContactGridCard
          :content="{
            name: 'Amalie Fridfeldt Hauge',
            position: $t('contact.positions.head'),
            email: 'leder@et-dagen.no',
            phone: '+47 902 04 787',
            image: '/images/board/manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Magnus Arnfinn Aubell',
            position: $t('contact.positions.deputyHead'),
            email: 'nestleder@et-dagen.no',
            phone: '+47 466 75 353',
            image: '/images/board/deputy_manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Bethlehem Taglo Lewtie',
            position: $t('contact.positions.finance'),
            email: 'okonomi@et-dagen.no',
            phone: '+47 483 935 04',
            image: '/images/board/finance.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Andreas Teodor Nysæter',
            position: $t('contact.positions.logistics'),
            email: 'logistikk@et-dagen.no',
            phone: '+47 468 869 97',
            image: '/images/board/logistics.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Andrea Gladhaug',
            position: $t('contact.positions.business'),
            email: 'bedriftansvarlig@et-dagen.no',
            phone: '+47 489 586 05',
            image: '/images/board/business.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Jon Arne Lund',
            position: $t('contact.positions.spons'),
            email: 'spons@et-dagen.no',
            phone: '+47 977 036 74',
            image: '/images/board/sponsor.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Elias Drøpping',
            position: $t('contact.positions.marketing'),
            email: 'mfansvarlig@et-dagen.no',
            phone: '+47 908 89 682',
            image: '/images/board/marketing.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: ' Peder Ingmar Dahl',
            position: $t('contact.positions.IT'),
            email: 'itansvarlig@et-dagen.no',
            phone: '+47 912 460 56',
            image: '/images/board/it.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Karin Skinderhaug',
            position: $t('contact.positions.travel'),
            email: 'turansvarlig@et-dagen.no',
            phone: '+47 484 578 35',
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
