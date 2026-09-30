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
    // wide-event logging (read by server/utils/logger.ts)
    logLevel: process.env.LOG_LEVEL ?? '',
    logSampleRate: process.env.LOG_SAMPLE_RATE ?? '',
    serviceName: process.env.SERVICE_NAME ?? '',
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
    '@vueuse/nuxt',
    '@nuxt/image',
  ],

  nitro: {
    experimental: {
      openAPI: true,
    },
    openAPI: {
      meta: {
        title: 'E&T-dagene API',
        description: 'HTTP API for etdagen.no',
        // Overridden by the docs workflow with branch + short SHA
        version: process.env.DOCS_VERSION ?? 'dev',
      },
      // The spec is served in `nuxt dev`, and prerendered to a static file by
      // the docs workflow. It is never part of the production image — the docs
      // are published to docs.etdagen.no instead, so the live site exposes no
      // route enumerating the API.
      production: process.env.DOCS_BUILD === 'true' ? 'prerender' : false,
    },
  },

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
