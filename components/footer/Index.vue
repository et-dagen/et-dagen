<template>
  <footer>
    <section class="top">
      <VImg class="image" :width="30" src="/images/logo_long_neg.png" />
      <ul class="pa-0 ma-0">
        <li>
          <span class="header text-h4">{{
            $t('footer.header.resources')
          }}</span>
          <NuxtLink to="/program">{{ $t('footer.link.program') }}</NuxtLink>
          <NuxtLink to="/jobs">{{ $t('footer.link.jobs') }}</NuxtLink>
        </li>
        <li>
          <span class="header text-h4">{{ $t('footer.header.join') }}</span>
          <NuxtLink to="mailto:bedriftansvarlig@et-dagen.no"
            >bedriftansvarlig@</NuxtLink
          >
          <NuxtLink to="mailto:logistikk@et-dagen.no">logistikk@</NuxtLink>
        </li>
        <li>
          <span class="header text-h4">{{
            $t('footer.header.organisation')
          }}</span>
          <NuxtLink to="https://www.ntnu.edu/studies/mtelsys">MTELSYS</NuxtLink>
          <NuxtLink to="/contact">{{ $t('footer.link.contact') }}</NuxtLink>
        </li>
      </ul>
    </section>
    <section class="bottom">
      <span>Elektronikk- & Teknologidagene 2023</span>
      <span class="org">Org nr.: 996 858 545</span>
    </section>
  </footer>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  * {
    box-sizing: border-box;
    color: rgb(var(--v-theme-background)) !important;
  }

  footer {
    margin-top: calc(50px + 4vw) !important;
    padding-block: 20px;
    background-color: rgb(var(--v-theme-primary));
    clip-path: polygon(0 0%, 100% 4vw, 100% 100%, 0 100%);

    section {
      padding: 0 50px;

      &.bottom {
        padding-top: 10px;
        border-top: 1px solid rgba(var(--v-theme-background), 0.1) !important;
        display: flex;
        flex-direction: column;

        .org {
          color: rgba(var(--v-theme-background), 0.6) !important;
        }
      }

      &.top {
        padding-top: 30px;
        margin-bottom: 48px;

        .header {
          color: rgba(var(--v-theme-background), 0.6) !important;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 20px !important;
        }

        .image {
          display: block;
          height: 90px !important;
          width: 200px !important;
          margin: 0 0 30px;
        }

        ul {
          list-style: none;
          display: grid;
          gap: 30px;
          grid-template-columns: repeat(2, 1fr);

          li a {
            display: block;
            margin-bottom: 10px;
          }
        }
      }
    }
  }

  @media #{map-get(settings.$display-breakpoints, 'sm-and-up')} {
    footer section {
      &.top ul {
        grid-template-columns: repeat(4, 1fr);
        padding-right: 0;
      }
    }
  }

  @media #{map-get(settings.$display-breakpoints, 'xs')} {
    footer section {
      &.top ul {
        grid-template-columns: repeat(2, 1fr);
        right-padding: 10% !important;
      }
    }
  }
</style>
