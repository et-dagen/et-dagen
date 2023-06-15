// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
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

  modules: ['@invictus.codes/nuxt-vuetify'],

  vuetify: {
    vuetifyOptions: {
      // custom themes and defaults go here
    },

    moduleOptions: {
      // module options go here
    },
  },
});
