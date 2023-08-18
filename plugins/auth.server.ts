export default defineNuxtPlugin((nuxtApp: any) => {
  const authStore = useAuthStore(nuxtApp.$pinia)

  // get h3 event context
  const { user } = nuxtApp.ssrContext.event.context

  // populate pinia store for server side rendering if the user is authenticated
  if (user) authStore.user = user
})
