<script setup lang="ts">
  import type { NuxtError } from '#app'
  import Alert from '@/components/common/Alert.vue'

  const props = defineProps<{ error: NuxtError }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const missing = computed(() => props.error.statusCode === 404)
  useHead({
    title: computed(() =>
      t(missing.value ? 'error.page.missing_title' : 'error.page.failed_title'),
    ),
  })

  // the address without its locale prefix, as the visitor typed it
  const path = computed(() => {
    const slug = route.params.slug
    if (Array.isArray(slug)) return `/${slug.join('/')}`
    return slug ? `/${slug}` : route.path
  })

  const home = () => clearError({ redirect: localePath('/') })
</script>

<template>
  <!-- error.vue replaces app.vue, so it brings its own app and layout -->
  <VApp>
    <Alert />
    <NuxtLayout>
      <div v-if="missing" class="d-flex h-screen mt-10 justify-center">
        <VSheet class="text-center">
          <h1 class="text-h1 pb-9">404</h1>
          <h5 class="text-h5 py-3 break-text">
            {{ $t('error.page_not_found.page_doesnt_exist') }}: {{ path }}
          </h5>
          <VBtn @click="home">
            {{ $t('error.page_not_found.navigate_front_page') }}
          </VBtn>
        </VSheet>
      </div>
      <div v-else class="d-flex h-screen justify-center">
        <VSheet class="text-center mt-10">
          <h1 class="text-orange text-h1 font-weight-bold pb-3">
            {{ $t('error.page.oh_no') }}
          </h1>
          <h4 class="text-h4 pb-1">
            {{ $t('error.page.status', { code: error.statusCode }) }}
          </h4>
          <h5 class="text-h5 pb-2 break-text">
            {{ error.message }}
          </h5>
          <VBtn @click="home">
            {{ $t('error.page_not_found.navigate_front_page') }}
          </VBtn>
        </VSheet>
      </div>
    </NuxtLayout>
  </VApp>
</template>

<style scoped>
  .break-text {
    max-width: 90vw;
    word-wrap: break-word;
  }
</style>
