export default defineNuxtRouteMiddleware((to, from) => {
  // route is not protected
  if (!to.meta.protected) return

  const authStore = useAuthStore()

  // user is logged in
  if (authStore.isLoggedIn) return

  // user is not logged in
  authStore.pendingRoute = to.fullPath

  // for some reason using navigateTo('/') resets the store value on the initial page load
  // return navigateTo('/')
  return useRouter().push({ path: '/' })
})
