// keep the subject in step with who is signed in, so menus and guards ask about the right user
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  watch(
    () => auth.user?.uid,
    (uid) => {
      if (!uid) auth.subject = null
      else if (auth.subject?.uid !== uid) auth.loadSubject()
    },
  )
})
