import { themes, defaults } from './config/vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    // used by firebase admin sdk
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    public: {
      FB_API_KEY: process.env.NUXT_FB_API_KEY,
      FB_AUTH_DOMAIN: process.env.NUXT_FB_AUTH_DOMAIN,
      FB_DB_URL: process.env.NUXT_FB_DATABASE_URL,
      FB_PROJECT_ID: process.env.NUXT_FB_PROJECT_ID,
      FB_STORAGE_BUCKET: process.env.NUXT_FB_STORAGE_BUCKET,
      FB_MESSAGING_SENDER_ID: process.env.NUXT_FB_MESSAGING_SENDER_ID,
      FB_APP_ID: process.env.NUXT_FB_APP_ID,
      FB_MEASUREMENT_ID: process.env.NUXT_FB_MEASUREMENT_ID,
    },
  },

  imports: {
    dirs: ['stores'],
  },

  modules: [
    '@invictus.codes/nuxt-vuetify',
    '@pinia/nuxt',
    'nuxt-vitest',
    '@nuxtjs/i18n',
  ],
  i18n: {
    lazy: true,
    langDir: 'locales',
    strategy: 'no_prefix',
    locales: [
      {
        code: 'nb-NO',
        iso: 'nb-NO',
        name: 'Norsk Bokmål',
        file: 'nb-NO.json',
      },
      {
        code: 'en-US',
        iso: 'en-US',
        name: 'English(US)',
        file: 'en-US.json',
      },
    ],
    defaultLocale: 'nb-NO',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // recommended
    },
  },

  vuetify: {
    vuetifyOptions: {
      // custom themes and defaults go here
      theme: {
        themes,
      },
      defaults,
    },

    moduleOptions: {
      // module options go here
      treeshaking: true,
    },
  },

  pinia: {
    autoImports: ['defineStore', ['defineStore', 'definePiniaStore']],
  },

  hooks: {
    // automatically adds meta data to pages
    // in the @proteced folder
    'pages:extend': (pages) => {
      pages.forEach((page) => {
        if (!page.path.includes('@protected')) return

        // update nuxt page
        page.name = page.name?.split('@protected-')[1]
        page.path = page.path?.split('/@protected')[1]
        page.meta = {
          protected: true,
        }
      })
    },
  },
})
