<script setup lang="ts">
  import { Mail } from '@lucide/vue'

  const localePath = useLocalePath()
</script>

<template>
  <footer>
    <section class="top">
      <img
        height="80"
        class="tw:mb-8"
        src="/images/logo_long_neg.png"
        alt="E&amp;T-dagene"
      />
      <ul>
        <li>
          <span class="header fade">{{ $t('footer.header.resources') }}</span>
          <NuxtLink :to="localePath('/programme')">{{
            $t('footer.link.program')
          }}</NuxtLink>
          <NuxtLink :to="localePath('/jobs')">{{
            $t('footer.link.jobs')
          }}</NuxtLink>
          <NuxtLink :to="localePath('/faq')">{{ $t('nav.faq') }}</NuxtLink>
        </li>
        <li>
          <span class="header fade">{{ $t('footer.header.join') }}</span>
          <NuxtLink to="mailto:bedriftansvarlig@et-dagen.no">
            <Mail class="mail-icon fade" aria-hidden="true" />
            {{ $t('contact.positions.business') }}
          </NuxtLink>
          <NuxtLink to="mailto:logistikk@et-dagen.no">
            <Mail class="mail-icon fade" aria-hidden="true" />
            {{ $t('contact.positions.logistics') }}
          </NuxtLink>
        </li>
        <li>
          <span class="header fade">{{
            $t('footer.header.organisation')
          }}</span>
          <NuxtLink to="https://www.ntnu.no/studier/mtelsys" target="_blank">
            MTELSYS
          </NuxtLink>
          <NuxtLink :to="localePath('/contact')">{{
            $t('footer.link.contact')
          }}</NuxtLink>
          <NuxtLink to="https://github.com/et-dagen" target="_blank">
            GitHub
          </NuxtLink>
        </li>
        <li>
          <span class="header fade">{{ $t('footer.header.some') }}</span>
          <NuxtLink to="https://www.instagram.com/etdagene/" target="_blank">
            Instagram
          </NuxtLink>
          <NuxtLink to="https://www.facebook.com/etdagen" target="_blank">
            Facebook
          </NuxtLink>
          <!-- eslint-disable vue/max-len -->
          <NuxtLink
            :to="`https://www.linkedin.com/company/elektronikk-og-teknologidagene-ntnu/`"
            target="_blank"
          >
            <!-- eslint-enable -->
            Linkedin
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section class="bottom">
      <span>Elektronikk- & Teknologidagene</span>
      <span class="fade">Addr.: O.S. Bragstads plass 2, 7034 TRONDHEIM</span>
      <span class="fade">Org nr.: 996 858 545</span>
    </section>
  </footer>
</template>

<style scoped>
  footer {
    margin-top: calc(50px + 4vw);
    padding-block: 20px;
    color: #ffffff;
    background-color: var(--brand);
    clip-path: polygon(0 0%, 100% 4vw, 100% 100%, 0 100%);
  }

  .fade {
    color: rgb(255 255 255 / 0.7);
  }

  section {
    padding: 0 50px;
  }

  .bottom {
    display: flex;
    flex-direction: column;
    padding-top: 10px;
    border-top: 1px solid rgb(255 255 255 / 0.1);
  }

  .top {
    padding-top: 30px;
    margin-bottom: 48px;
  }

  .header {
    font-size: 20px;
    font-weight: 400;
    line-height: 1.175;
    letter-spacing: 0.0073529412em;
  }

  ul {
    display: grid;
    gap: 30px;
    grid-template-columns: repeat(2, 1fr);
  }

  li a {
    display: block;
    margin-bottom: 10px;
  }

  .mail-icon {
    display: none;
    width: 20px;
    height: 20px;
    margin-right: 8px;
    vertical-align: middle;
  }

  @media (min-width: 600px) {
    ul {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 960px) {
    ul {
      grid-template-columns: repeat(4, 1fr);
    }

    .mail-icon {
      display: inline-block;
    }
  }
</style>
