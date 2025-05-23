<template>
  <div class="my-16">
    <h3 class="text-center mb-6">{{ $t('contact.title') }}</h3>
    <VContainer class="mb-6 px-md-12 d-none d-sm-block">
      <ContactCard
        class="mx-auto w-75"
        :content="{
          name: 'Johnny Nguyen',
          position: $t('contact.positions.business'),
          email: 'bedriftansvarlig@et-dagen.no',
          phone: '+47 921 18 424',
          image: '/images/board/business.jpg',
        }"
      />
    </VContainer>

    <h4 class="text-center">{{ $t('contact.board') }}</h4>
    <VContainer>
      <CommonGrid>
        <ContactGridCard
          :content="{
            name: 'Nhan-Daniel Vinh Nguyen',
            position: $t('contact.positions.head'),
            email: 'leder@et-dagen.no',
            phone: '+47 473 55 881',
            image: '/images/board/manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Marek Myrebøe Engels',
            position: $t('contact.positions.deputyHead'),
            email: 'nestleder@et-dagen.no',
            phone: '+47 401 70 610',
            image: '/images/board/deputy_manager.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Lisa Radford',
            position: $t('contact.positions.finance'),
            email: 'okonomi@et-dagen.no',
            phone: '+47 479 59 828',
            image: '/images/board/finance.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Kjartan Roalsvik',
            position: $t('contact.positions.logistics'),
            email: 'logistikk@et-dagen.no',
            phone: '+47 911 82 880',
            image: '/images/board/logistics.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Johnny Ngo Nguyen',
            position: $t('contact.positions.business'),
            email: 'bedriftansvarlig@et-dagen.no',
            phone: '+47 921 18 424',
            image: '/images/board/business.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Hanne Gaaren',
            position: $t('contact.positions.spons'),
            email: 'spons@et-dagen.no',
            phone: '+47 958 71 575',
            image: '/images/board/sponsor.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Fride Fossheim',
            position: $t('contact.positions.marketing'),
            email: 'mfansvarlig@et-dagen.no',
            phone: '+47 954 00 451',
            image: '/images/board/marketing.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Lisa Bruun Paulsen',
            position: $t('contact.positions.IT'),
            email: 'itansvarlig@et-dagen.no',
            phone: '+47 481 19 419',
            image: '/images/board/it.jpg',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Eva Skillingstad',
            position: $t('contact.positions.travel'),
            email: 'turansvarlig@et-dagen.no',
            phone: '+47 916 97 196',
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
