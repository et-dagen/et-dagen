export default defineNuxtRouteMiddleware((to) => {
  // check if route is protected
  if (!to.meta.protected) return

  // get auth state from store
  const auth = useAuthStore()
  const isLoggedIn = auth.isLoggedIn

  const accessLevel = to.meta.accessLevel

  // user is authenticated and has the required access level
  if (isLoggedIn && auth.hasAccessLevel(accessLevel)) return

  // user is not authenticated
  const localePath = useLocalePath()
  return navigateTo(localePath('/user/login'))
})
