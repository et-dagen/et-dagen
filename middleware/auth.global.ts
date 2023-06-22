export default defineNuxtRouteMiddleware(async (to) => {
  // skip middleware if app is hydrating
  const nuxtApp = useNuxtApp()
  if (nuxtApp.isHydrating) return

  // route is protected
  if (!to.meta.protected) return

  const headers = useRequestHeaders(['cookie'])

  const isLoggedIn = process.client
    ? useAuthStore().isLoggedIn
    : // check auth server side
      await $fetch('/api/getAuth', { headers })

  // user is authenticated
  if (isLoggedIn) return

  // user is not authenticated
  return navigateTo('/')
})
