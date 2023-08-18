export default defineNuxtRouteMiddleware((to) => {
  // route is protected
  if (!to.meta.protected) return

  // when navigating client side the auth state is
  // collected from the auth store
  const isLoggedIn = useAuthStore().isLoggedIn

  // user is authenticated
  if (isLoggedIn) return

  // user is not authenticated
  return navigateTo('/')
})
