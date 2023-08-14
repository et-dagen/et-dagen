export default defineNuxtRouteMiddleware(async (to) => {
  // skip middleware if app is hydrating
  const nuxtApp = useNuxtApp()
  if (nuxtApp.isHydrating) return

  // route is protected
  if (!to.meta.protected) return

  // makes sure that the token cookie is included
  // in the initial request headers
  const headers = useRequestHeaders(['cookie'])

  // when navigating client side the auth state is
  // collected from the auth store
  const isLoggedIn = process.client
    ? useAuthStore().isLoggedIn
    : // check auth server side
      await $fetch('/api/auth', { headers })

  // user is authenticated
  if (isLoggedIn) return

  // user is not authenticated
  return navigateTo('/')
})
