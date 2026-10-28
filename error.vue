<script setup lang="ts">
  import type { NuxtError } from '#app'
  import { ArrowRight, House } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{ error: NuxtError }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const missing = computed(() => props.error.statusCode === 404)
  const title = computed(() =>
    t(missing.value ? 'error.page.missing_title' : 'error.page.failed_title'),
  )
  useHead({ title })

  const elsewhere = [
    { label: 'nav.programme', to: '/programme' },
    { label: 'nav.jobs', to: '/jobs' },
    { label: 'nav.contact', to: '/contact' },
  ]
</script>

<template>
  <NuxtLayout>
    <div
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:items-start tw:gap-8 tw:px-4 tw:py-8 tw:lg:px-8 tw:lg:py-12"
    >
      <!-- the code on a plate, as the rooms are signed in Elbygget -->
      <p
        class="tw:rounded-md tw:bg-plate tw:px-4 tw:pt-2 tw:pb-1 tw:text-5xl tw:font-black tw:tabular-nums tw:text-plate-foreground tw:lg:text-6xl"
      >
        {{ error.statusCode }}
      </p>

      <div class="tw:flex tw:max-w-prose tw:flex-col tw:gap-3">
        <h1
          class="tw:text-3xl tw:font-extrabold tw:tracking-tight tw:text-balance tw:lg:text-[2.5rem]"
        >
          {{ title }}
        </h1>
        <p v-if="missing" class="tw:text-lg tw:text-muted-foreground">
          <i18n-t keypath="error.page.missing_text" scope="global">
            <template #path>
              <span class="tw:font-semibold tw:break-all tw:text-foreground">
                {{ route.path }}
              </span>
            </template>
          </i18n-t>
        </p>
        <p v-else class="tw:text-lg tw:text-muted-foreground">
          {{ $t('error.page.failed_text') }}
        </p>
      </div>

      <Button as-child size="lg">
        <NuxtLink :to="localePath('/')">
          <House aria-hidden="true" />
          {{ $t('error.page.home') }}
        </NuxtLink>
      </Button>

      <nav
        :aria-label="$t('error.page.elsewhere')"
        class="tw:flex tw:w-full tw:flex-col tw:gap-3 tw:border-t tw:pt-6"
      >
        <p class="tw:text-sm tw:font-bold">{{ $t('error.page.elsewhere') }}</p>
        <ul class="tw:flex tw:flex-wrap tw:gap-x-8 tw:gap-y-2">
          <li v-for="link in elsewhere" :key="link.to">
            <NuxtLink
              :to="localePath(link.to)"
              class="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-4 tw:hover:decoration-brand"
            >
              {{ $t(link.label) }}
              <ArrowRight class="tw:size-4" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </NuxtLayout>
</template>
