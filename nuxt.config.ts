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

  css: ['vuetify/styles'],

  modules: [
    '@pinia/nuxt',
    'nuxt-vitest',
    '@nuxtjs/i18n',
    'vuetify-nuxt-module',
  ],
  i18n: {
    lazy: true,
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'no',
        iso: 'nb-NO',
        name: 'Norsk Bokmål',
        file: 'nb-NO.json',
        isCatchallLocale: true,
      },
      {
        code: 'en',
        iso: 'en-US',
        name: 'English (United States)',
        file: 'en-US.json',
      },
    ],
    defaultLocale: 'no',
    vueI18n: 'i18n.config.ts',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // recommended
    },
  },

  pinia: {
    autoImports: ['defineStore', ['defineStore', 'definePiniaStore']],
  },

  vuetify: {
    moduleOptions: {
      styles: {
        configFile: '/assets/scss/settings.scss',
      },
    },
    vuetifyOptions: './config/vuetify/vuetify.config.ts',
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

  // nuxt inlineSSRStyles not compatiable with Vuetify :(
  // https://github.com/userquin/vuetify-nuxt-module/issues/74
  experimental: {
    inlineSSRStyles: false,
  },

  // enable nuxt devtools
  devtools: {
    enabled: true,
  },
})
