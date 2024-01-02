// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          href: '/images/favicon-light.ico',
          type: 'image/x-icon',
          media: '(prefers-color-scheme: light)',
        },
        {
          rel: 'icon',
          href: '/images/favicon.ico',
          type: 'image/x-icon',
          media: '(prefers-color-scheme: dark)',
        },
      ],
    },
  },
  runtimeConfig: {
    // used by firebase admin sdk
    FB_ADMIN_TYPE: process.env.FB_ADMIN_TYPE,
    FB_ADMIN_PROJECT_ID: process.env.FB_ADMIN_PROJECT_ID,
    FB_ADMIN_PRIVATE_KEY_ID: process.env.FB_ADMIN_PRIVATE_KEY_ID,
    FB_ADMIN_PRIVATE_KEY: process.env.FB_ADMIN_PRIVATE_KEY,
    FB_ADMIN_CLIENT_EMAIL: process.env.FB_ADMIN_CLIENT_EMAIL,
    FB_ADMIN_CLIENT_ID: process.env.FB_ADMIN_CLIENT_ID,
    FB_ADMIN_AUTH_URI: process.env.FB_ADMIN_AUTH_URI,
    FB_ADMIN_TOKEN_URI: process.env.FB_ADMIN_TOKEN_URI,
    FB_ADMIN_AUTH_PROVIDER_CERL_URL:
      process.env.FB_ADMIN_AUTH_PROVIDER_CERL_URL,
    FB_ADMIN_CLIENT_CERT_URL: process.env.FB_ADMIN_CLIENT_CERT_URL,
    FB_ADMIN_UNIVERSE_DOMAIN: process.env.FB_ADMIN_UNIVERSE_DOMAIN,
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

  css: ['@/assets/scss/main.scss'],

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'vuetify-nuxt-module',
    'nuxt-vitest',
    '@vueuse/nuxt',
  ],

  i18n: {
    lazy: false,
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'no',
        iso: 'nb-NO',
        name: 'Norsk',
        file: 'nb-NO.json',
        isCatchallLocale: true,
      },
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
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
    vuetifyOptions: './config/vuetify/vuetify.config.ts',
  },

  // enable nuxt devtools
  devtools: {
    enabled: false,
  },

  devServer: {
    host: '0.0.0.0', // default: localhost
  },
})
