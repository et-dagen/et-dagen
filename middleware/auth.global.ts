export default defineNuxtRouteMiddleware((to) => {
  // check if route is protected
  if (!to.meta.protected) return

  // get auth state from store
  const auth = useAuthStore()
  const isLoggedIn = auth.isLoggedIn

  // check if user has access
  const accessLevels = to.meta.accessLevels
  const hasAccess = auth.hasAccess(accessLevels)

  // user is authenticated and has the required access level
  if (isLoggedIn && hasAccess) return

  // user does not have access
  const localePath = useLocalePath()
  const redirectPath = hasAccess ? '/user/signin' : '/user'

  return navigateTo(localePath(redirectPath))
})
