<template>
  <div>
    <ContactCard
      class="mx-auto"
      :content="{
        name: 'Ian Philip Eglin',
        position: $t('contact.positions.IT'),
        email: 'itansvarlig@et-dagen.no',
        phone: '+47 123 45 678',
        image: 'https://picsum.photos/500/300?image=60',
      }"
    />

    <CompanyGrid>
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
          email: 'nestleser@et-dagen.no',
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
          position: $t('contact.positions.traveling'),
          email: 'turansvarlig@et-dagen.no',
          phone: '+47 123 45 678',
          image: 'https://picsum.photos/500/300?image=60',
        }"
      />
    </CompanyGrid>
  </div>
</template>
