export default defineNuxtRouteMiddleware(async (to) => {
  // check if route is protected
  if (!to.meta.protected) return

  const auth = useAuthStore()
  // signed in on this page, so the server has not sent the subject yet
  if (auth.isLoggedIn && auth.subject?.uid !== auth.user?.uid) {
    await auth.loadSubject()
  }

  const allowed = !to.meta.area || auth.allows(to.meta.area)
  if (auth.isLoggedIn && allowed) return

  const localePath = useLocalePath()
  return navigateTo(localePath(auth.isLoggedIn ? '/user' : '/user/signin'))
})
