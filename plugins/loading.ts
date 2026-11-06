import { usePageLoading } from '@/composables/usePageLoading'

export default defineNuxtPlugin((nuxtApp) => {
  const loading = usePageLoading()
  nuxtApp.hook('page:start', () => {
    loading.value = true
  })
  nuxtApp.hook('page:finish', () => {
    loading.value = false
  })
})
