export default defineNuxtRouteMiddleware(async (to) => {
  // a page in an area is protected too; `protected` alone asks only for a signed-in user
  if (!to.meta.protected && !to.meta.area) return

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
