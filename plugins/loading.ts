export default defineNuxtPlugin((nuxtApp: any) => {
  const appStore = useAppStore()

  nuxtApp.hook('page:start', () => {
    appStore.loading = true
  })

  nuxtApp.hook('page:finish', () => {
    appStore.loading = false
  })
})
