// vuetify.config.ts
// eslint-disable-next-line vue/max-len
import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'
import { themes, defaults } from '.'

export default defineVuetifyConfiguration({
  /* vuetify options */
  theme: { themes },
  defaults,
})
