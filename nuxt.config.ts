// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'E&T-dagene',
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
    firebaseAdminType: process.env.NUXT_FIREBASE_ADMIN_TYPE ?? '',
    firebaseAdminProjectId: process.env.NUXT_FIREBASE_ADMIN_PROJECT_ID ?? '',
    firebaseAdminPrivateKeyId:
      process.env.NUXT_FIREBASE_ADMIN_PRIVATE_KEY_ID ?? '',
    firebaseAdminPrivateKey: process.env.NUXT_FIREBASE_ADMIN_PRIVATE_KEY ?? '',
    firebaseAdminClientEmail:
      process.env.NUXT_FIREBASE_ADMIN_CLIENT_EMAIL ?? '',
    firebaseAdminClientId: process.env.NUXT_FIREBASE_ADMIN_CLIENT_ID ?? '',
    firebaseAdminAuthUri: process.env.NUXT_FIREBASE_ADMIN_AUTH_URI ?? '',
    firebaseAdminTokenUri: process.env.NUXT_FIREBASE_ADMIN_TOKEN_URI ?? '',
    firebaseAdminAuthProviderCertUrl:
      process.env.NUXT_FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL ?? '',
    firebaseAdminClientCertUrl:
      process.env.NUXT_FIREBASE_ADMIN_CLIENT_CERT_URL ?? '',
    firebaseAdminUniverseDomain:
      process.env.NUXT_FIREBASE_ADMIN_UNIVERSE_DOMAIN ?? '',
    firebaseAdminStorageBucket:
      process.env.NUXT_FIREBASE_ADMIN_STORAGE_BUCKET ?? '',
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      firebaseDatabaseUrl: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      firebaseStorageBucket:
        process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
      firebaseMeasurementId:
        process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
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
    '@nuxt/image',
  ],

  i18n: {
    lazy: false,
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'no',
        language: 'nb-NO',
        name: 'Norsk',
        file: 'nb-NO.json',
        isCatchallLocale: true,
      },
      {
        code: 'en',
        language: 'en-US',
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

  image: {
    inject: true,
    screens: {
      xs: 599,
      sm: 959,
      md: 1279,
      lg: 1919,
      xl: 2559,
    },
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

  compatibilityDate: '2024-12-26',
})
