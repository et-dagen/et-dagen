// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    // used by firebase admin sdk
    GOOGLE_APPLICATION_CREDENTIALS:
      process.env.NODE_ENV === 'production'
        ? process.env.GOOGLE_APPLICATION_CREDENTIALS_PROD
        : process.env.GOOGLE_APPLICATION_CREDENTIALS_DEV,
    public: {
      FB_API_KEY:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_API_KEY_PROD
          : process.env.NUXT_FB_API_KEY_DEV,
      FB_AUTH_DOMAIN:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_AUTH_DOMAIN_PROD
          : process.env.NUXT_FB_AUTH_DOMAIN_DEV,
      FB_DB_URL:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_DATABASE_URL_PROD
          : process.env.NUXT_FB_DATABASE_URL_DEV,
      FB_PROJECT_ID:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_PROJECT_ID_PROD
          : process.env.NUXT_FB_PROJECT_ID_DEV,
      FB_STORAGE_BUCKET:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_STORAGE_BUCKET_PROD
          : process.env.NUXT_FB_STORAGE_BUCKET_DEV,
      FB_MESSAGING_SENDER_ID:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_MESSAGING_SENDER_ID_PROD
          : process.env.NUXT_FB_MESSAGING_SENDER_ID_DEV,
      FB_APP_ID:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_APP_ID_PROD
          : process.env.NUXT_FB_APP_ID_DEV,
      FB_MEASUREMENT_ID:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_MEASUREMENT_ID_PROD
          : process.env.NUXT_FB_MEASUREMENT_ID_DEV,
    },
  },

  imports: {
    dirs: ['stores'],
  },

  css: ['vuetify/styles', '@/assets/scss/main.scss'],

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'vuetify-nuxt-module',
    'nuxt-vitest',
  ],

  i18n: {
    lazy: false,
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
    vueI18n: 'config/i18n.config.ts',
    detectBrowserLanguage: false,
  },

  pinia: {
    autoImports: [
      'defineStore',
      ['defineStore', 'definePiniaStore'],
      'storeToRefs',
    ],
  },

  vuetify: {
    moduleOptions: {
      styles: {
        configFile: '/assets/scss/settings.scss',
      },
    },
    vuetifyOptions: './config/vuetify/vuetify.config.ts',
  },

  // nuxt inlineSSRStyles not compatiable with Vuetify :(
  // https://github.com/userquin/vuetify-nuxt-module/issues/74
  experimental: {
    inlineSSRStyles: false,
  },

  // enable nuxt devtools
  devtools: {
    enabled: false,
  },

  devServer: {
    host: '0.0.0.0', // default: localhost
  },
})
