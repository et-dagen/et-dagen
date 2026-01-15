<script setup lang="ts">
  import Infobox from '../../components/faq/Infobox.vue'
</script>

<template>
  <div class="info-page">
    <div class="titlewrapper my-16">
      <h4 class="mb-6">Ofte stilte spørsmål</h4>
    </div>
    <div class="contentwrapper">
      <p>Dette er bare lorem ipsum.</p>
      <p>
        Ved å bli medlem i E&T-dagene, får din bedrift en
        <emph>ettertraktet</emph> mulighet til eksponering blant Gløshaugen
        skarpeste, gjennom en standplass i Glassgården på NTNU, og mulighet for
        å holde egne bedrift-presentasjoner, intervjuer, bla bla bla.
      </p>

      <Infobox title="Hvilke muligheter har min bedrift til profilering?"
        ><p>
          Vi tilbyr speedintervju, bedriftpresentasjon og gode standplasser.
        </p>
      </Infobox>
      <Infobox title="Hvordan kan jeg melde på min bedrift?">
        <p>For å melde på din bedrift, kontakt bedriftansvarlig.</p>
      </Infobox>
      <Infobox title="Hvor gjennomføres E&T-dagene?">
        <p>
          E&T-dagene gjennomføres i Glassgården, i elektrobygget. Nærmeste
          ankomstplass for bil/taxi er på vestsiden av Hovedbygget.
        </p>
      </Infobox>
      <Infobox title="Hvor kan jeg bestille ekstra utstyr?"
        ><p>Kontakt vår logistikkansvarlig, så hjelper vi med bestilling.</p>
      </Infobox>
    </div>
  </div>
</template>

<style scoped>
  .info-page {
    max-width: 700px;
    margin: 2rem auto;
    /* color:#5c6873; */
    font-family: 'Roboto', sans-serif;
  }
  .title {
    font-weight: bold;
    text-align: center;
  }
  .titlewrapper {
    /* height: 5em; */

    display: flex;

    align-items: center;
    justify-content: center;
  }
</style>
