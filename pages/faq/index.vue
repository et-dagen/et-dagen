<script setup lang="ts">
  import Infobox from '../../components/faq/Infobox.vue'
</script>

/* TODO: Add translation for the text*/
<template>
  <div class="container">
    <div class="info-page">
      <div class="titlewrapper my-16">
        <h3>{{ $t('faq.heading') }}</h3>
      </div>
      <div class="contentwrapper">
        <div class="textwrapper">
          <p>Dette er bare lorem ipsum.</p>
        </div>
        <div class="textwrapper">
          <p>
            Ved å bli medlem av E&T-dagene, får din bedrift en
            <emph>ettertraktet</emph> mulighet for eksponering blant Gløshaugens
            skarpeste, gjennom en standplass i vakre Glassgården på NTNU, og
            mulighet til å holde egne bedriftspresentasjoner, intervjuer, bla
            bla bla.
          </p>
        </div>

        <div class="subheading">
          <h4>{{ $t('faq.subheading') }}</h4>
        </div>

        <Infobox title="Hvilke muligheter har min bedrift til profilering?"
          ><p>
            Vi tilbyr speedintervju, bedriftpresentasjon og gode standplasser.
          </p>
        </Infobox>
        <Infobox title="Hvordan kan jeg melde på min bedrift?">
          <p>For å melde på din bedrift, kontakt vår bedriftsansvarlig.</p>
        </Infobox>
        <Infobox title="Hvor gjennomføres E&T-dagene?">
          <p>
            E&T-dagene gjennomføres i Glassgården, i elektrobygget. Nærmeste
            ankomstplass for bil/taxi er på vestsiden av Hovedbygget.
          </p>
        </Infobox>
        <Infobox title="Hvor kan jeg bestille utstyr?"
          ><p>Kontakt vår logistikkansvarlig, så hjelper vi med bestilling.</p>
        </Infobox>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .container {
    margin: 0 auto;
    padding: 0 30px;
  }

  .info-page {
    font-family: 'Roboto', sans-serif;
  }
  @media (min-width: 768px) {
    .container {
      width: 750px;
    }
  }
  @media (min-width: 960) {
    .container {
      width: 930px;
    }
  }
  .title {
    font-weight: bold;
    text-align: center;
  }
  .subheading {
    margin-top: 30px;
    margin-bottom: 20px;
  }
  .titlewrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .textwrapper {
    padding-bottom: 15px;
  }
</style>
