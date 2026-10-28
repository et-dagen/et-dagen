/**
 * The error page's error arrives from a query string, as an object without a prototype, and the
 * store's payload check calls `hasOwnProperty` on it. That crash left every server-rendered error
 * with Nuxt's bare fallback page instead of `error.vue`. A plain copy reads the same.
 */
export default defineNuxtPlugin({
  name: 'error-payload',
  enforce: 'pre',
  setup(nuxtApp) {
    const { error } = nuxtApp.payload
    if (error && Object.getPrototypeOf(error) === null) {
      nuxtApp.payload.error = { ...error }
    }
  },
})
