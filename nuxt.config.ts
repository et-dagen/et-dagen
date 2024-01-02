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
    FB_ADMIN_TYPE:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_TYPE_PROD
        : process.env.FB_ADMIN_TYPE_DEV,
    FB_ADMIN_PRIVATE_KEY_ID:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_PRIVATE_KEY_ID_PROD
        : process.env.FB_ADMIN_PRIVATE_KEY_ID_DEV,
    FB_ADMIN_PRIVATE_KEY:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_PRIVATE_KEY_PROD
        : process.env.FB_ADMIN_PRIVATE_KEY_DEV,
    FB_ADMIN_CLIENT_EMAIL:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_CLIENT_EMAIL_PROD
        : process.env.FB_ADMIN_CLIENT_EMAIL_DEV,
    FB_ADMIN_CLIENT_ID:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_CLIENT_ID_PROD
        : process.env.FB_ADMIN_CLIENT_ID_DEV,
    FB_ADMIN_AUTH_URI:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_AUTH_URI_PROD
        : process.env.FB_ADMIN_AUTH_URI_DEV,
    FB_ADMIN_TOKEN_URI:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_TOKEN_URI_PROD
        : process.env.FB_ADMIN_TOKEN_URI_DEV,
    FB_ADMIN_AUTH_PROVIDER_CERL_URL:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_AUTH_PROVIDER_CERL_URL_PROD
        : process.env.FB_ADMIN_AUTH_PROVIDER_CERL_URL_DEV,
    FB_ADMIN_CLIENT_CERT_URL:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_CLIENT_CERT_URL_PROD
        : process.env.FB_ADMIN_CLIENT_CERT_URL_DEV,
    FB_ADMIN_UNIVERSE_DOMAIN:
      process.env.NODE_ENV === 'production'
        ? process.env.FB_ADMIN_UNIVERSE_DOMAIN_PROD
        : process.env.FB_ADMIN_UNIVERSE_DOMAIN_DEV,
    public: {
      FB_ADMIN_PROJECT_ID:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_FB_ADMIN_PROJECT_ID_PROD
          : process.env.NUXT_FB_ADMIN_PROJECT_ID_DEV,

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
