export default defineNuxtPlugin(async (nuxtApp: any) => {
  const authStore = useAuthStore(nuxtApp.$pinia)

  // get h3 event context
  const { decodedToken } = nuxtApp.ssrContext.event.context

  // populate pinia store for server side rendering if the user is authenticated
  if (decodedToken) authStore.user = formatUser(decodedToken)
})
