<template>
  <div class="my-16">
    <h3 class="text-center mb-6">{{ $t('contact.title') }}</h3>
    <VContainer class="mb-6 px-md-12">
      <ContactCard
        class="mx-auto"
        :content="{
          name: 'Marius Liebig',
          position: $t('contact.positions.business'),
          email: 'bedriftansvarlig@et-dagen.no',
          phone: '+47 123 45 678',
          image: 'https://picsum.photos/500/300?image=60',
        }"
      />
    </VContainer>

    <h4 class="text-center">{{ $t('contact.board') }}</h4>
    <VContainer>
      <CommonGrid>
        <ContactGridCard
          :content="{
            name: 'Sara Stokke Aursand',
            position: $t('contact.positions.head'),
            email: 'leder@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Cecilie Von Krogh Fagtun',
            position: $t('contact.positions.deputyHead'),
            email: 'nestleder@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Tord Sætermo',
            position: $t('contact.positions.finance'),
            email: 'okonomi@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Anita Bueno Lindmoen',
            position: $t('contact.positions.logistics'),
            email: 'logistikk@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Marius Liebig',
            position: $t('contact.positions.business'),
            email: 'bedriftansvarlig@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Håvard Lundheim',
            position: $t('contact.positions.spons'),
            email: 'spons@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Anetta Lyche Knudsen',
            position: $t('contact.positions.marketing'),
            email: 'mfansvarlig@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Ian Philip Eglin',
            position: $t('contact.positions.IT'),
            email: 'itansvarlig@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
          }"
        />
        <ContactGridCard
          :content="{
            name: 'Josh Jude',
            position: $t('contact.positions.travel'),
            email: 'turansvarlig@et-dagen.no',
            phone: '+47 123 45 678',
            image: 'https://picsum.photos/500/300?image=60',
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
