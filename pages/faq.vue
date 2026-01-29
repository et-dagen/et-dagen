<script setup lang="ts">
  import Infobox from '../components/faq/Infobox.vue'
</script>

/* TODO: Add translation for the text*/
<template>
  <div class="container">
    <div class="info-page">
      <div class="titlewrapper my-16">
        <h3>{{ $t('forcompanies.about.heading') }}</h3>
      </div>
      <div class="aboutwrapper">
        <p>{{ $t('forcompanies.about.p1') }}</p>
        <br />
        <br />

        <p>{{ $t('forcompanies.about.p2') }}</p>
        <br />
        <br />

        <p>{{ $t('forcompanies.about.p3') }}</p>
        <br />
        <br />
        <em
          >{{ $t('forcompanies.about.contactus') }}
          <a href="mailto:bedriftansvarlig@et-dagen.no"
            >bedriftansvarlig@et-dagen.no</a
          ></em
        >
      </div>
      <div>
        <div class="subheading">
          <h4>{{ $t('forcompanies.faq.heading') }}</h4>
        </div>

        <Infobox title="Hva vi tilbyr">
          <ul>
            <li>
              <b>CV-database</b>: En nettbasert tjeneste som hjelper
              sivilingeniør-studenter og bedrifter med å komme i kontakt med
              hverandre. Studenter kan enkelt registrere CV og søknad hos dere,
              og dere kan lyse ut ledige stillinger. Alle bedrifter som deltar
              på E&T-dagene har ett års tilgang til CV-databasen.
            </li>

            <li>
              <b>Intervjurom</b>: Vi stiller med egne rom til intervjuer under
              E&T-dagene, og dagen etterpå.
            </li>
          </ul>

          <ul>
            <li>
              <b>Bedriftspresentasjon</b>: En mulighet til å informere og vekke
              interesse hos studentene. Vi stiller med auditorium og promotering
              i forkant.
            </li>
          </ul>

          <ul>
            <li>
              <b>Speedbedpress</b>: En rekke korte bedriftspresentasjoner der de
              deltagende bedriftene informerer om seg selv og sommerjobbene de
              utlyser.
            </li>
          </ul>

          <ul>
            <li>
              <b>Kontaktperson</b>: Vi stiller med en egen kontaktperson til
              hver bedrift, som er tilgjengelig under hele programmet.
            </li>
          </ul>

          <ul>
            <li>
              <b>Mat og Drikke</b>: Vi stiller med mat og drikke til deltakerne
              fra bedriften din, samt et oppholdsrom.
            </li>
          </ul>
        </Infobox>
        <Infobox title="Hvordan kan jeg melde på min bedrift?">
          <p>
            Kontakt oss direkte på bedriftansvarlig@et-dagen.no for informasjon
            om påmelding og priser!
          </p>
        </Infobox>
        <Infobox title="Hva hjelper E&T-dagene meg med å arrangere?">
          <p>
            Vi hjelper dere med å ordne stand, og med å arrangere
            bedriftspresentasjon og intervjuer/speedintervjuer.
          </p>
        </Infobox>
        <Infobox title="Standtips">
          <ol>
            <li>
              Vær engasjert og kontaktsøkende. Et åpent kroppsspråk og ekte
              interesse gjør det lettere for studenter å ta kontakt. Still
              spørsmål, lytt aktivt og inviter til dialog. Det skaper gode
              samtaler og et positivt førsteinntrykk.
            </li>
            <li>
              Stillingsannonser/Rekruttering. Mange av studentene er på jakt
              etter sommerjobb, internship eller fast stilling. Karrieredager
              gir en unik mulighet til å møte potensielle søkere ansikt til
              ansikt og vise hva dere ser etter i kandidater. Har dere
              stillingsannonser ute? Gjør dem enkle å finne! Tydelige QR-koder
              på stand senker friksjonen og gjør det lettere å søke i etterkant.
              En synlig og ryddig søknadsvei gjør også standen mer attraktiv å
              besøke.
            </li>
            <li>
              Ta plass! Studenter tiltrekkes av stands som synes og høres. Sørg
              for at standen ikke føles lukket! Åpne flater inviterer til
              samtale. Jo mer tilgjengelig og levende standen oppleves, desto
              flere stopper opp.
            </li>
            <li>
              Gjør standen minneverdig. En liten giveaway, en god samtale eller
              en morsom aktivitet kan være det som gjør at studentene husker
              nettopp dere etter at dagene er over.
            </li>
            <li>
              Følg opp i etterkant. Om dere møter spesielt interesserte
              studenter, oppmuntre til videre kontakt. Det lille ekstra steget
              kan gi store rekrutteringsgevinster.
            </li>
          </ol>
        </Infobox>
        <Infobox title="Hvordan kommer vi oss til lokalene?">
          <p>
            Nærmeste ankomst med bil er på sørsiden av frimerket; gressplenen
            rett bak Hovedbygget.
          </p>
        </Infobox>
        <Infobox title="Bestilling av ekstra utstyr">
          <p>
            Utover det som er inkludert i kontrakten kan det bestilles
            ekstrautstyr som for eksempel ekstra bord, ståbord, kaffe eller
            TV-skjermer. Kontakt oss på
            <a href="mailto:bedriftansvarlig@et-dagen.no"
              >bedriftansvarlig@et-dagen.no</a
            >.
          </p>
        </Infobox>
      </div>
    </div>
  </div>
</template>

<style scoped>
  a {
    color: rgb(var(--v-theme-primary-darken-1)) !important;
  }
  li {
    margin: 20px;
    margin-top: 0;
  }
  .info-page {
    font-family: 'Roboto', sans-serif;
  }
  .container {
    margin: 0 auto;
    padding: 0 30px;
    width: auto;
  }
  @media (min-width: 768px) {
    .container {
      width: 750px;
    }
  }
  @media (min-width: 960px) {
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
