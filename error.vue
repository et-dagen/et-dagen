<script setup lang="ts">
  import type { NuxtError } from '#app'
  import Alert from '@/components/common/Alert.vue'
  import { Button } from '@/components/ui/button'

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

  const heading = 'tw:text-[6rem] tw:leading-none tw:tracking-[-0.015625em]'
  const subheading =
    'tw:max-w-[90vw] tw:text-2xl tw:leading-8 tw:font-normal tw:break-words'
  const button = [
    'tw:h-[52px] tw:rounded tw:px-[26px] tw:text-lg tw:font-medium tw:tracking-[0.0892em]',
    'tw:bg-white tw:text-foreground tw:shadow-md tw:hover:bg-neutral-100',
  ]
</script>

<template>
  <!-- error.vue replaces app.vue, so it brings its own toaster and layout -->
  <div>
    <Alert />
    <NuxtLayout>
      <div
        v-if="missing"
        class="tw:mt-10 tw:flex tw:h-screen tw:justify-center"
      >
        <div class="tw:text-center">
          <h1 :class="[heading, 'tw:pb-9 tw:font-light']">404</h1>
          <h5 :class="[subheading, 'tw:py-3']">
            {{ $t('error.page_not_found.page_doesnt_exist') }}: {{ path }}
          </h5>
          <Button :class="button" @click="home">
            {{ $t('error.page_not_found.navigate_front_page') }}
          </Button>
        </div>
      </div>
      <div v-else class="tw:flex tw:h-screen tw:justify-center">
        <div class="tw:mt-10 tw:text-center">
          <h1 :class="[heading, 'tw:pb-3 tw:font-bold tw:text-[#FF9800]']">
            {{ $t('error.page.oh_no') }}
          </h1>
          <h4
            class="tw:pb-1 tw:text-[2.125rem] tw:leading-10 tw:font-normal tw:tracking-[0.0073529412em]"
          >
            {{ $t('error.page.status', { code: error.statusCode }) }}
          </h4>
          <h5 :class="[subheading, 'tw:pb-2']">
            {{ error.message }}
          </h5>
          <Button :class="button" @click="home">
            {{ $t('error.page_not_found.navigate_front_page') }}
          </Button>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>
