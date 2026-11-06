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
      class="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-8 lg:px-8 lg:py-12"
    >
      <!-- the code on a plate, as the rooms are signed in Elbygget -->
      <p
        class="rounded-md bg-plate px-4 pt-2 pb-1 text-5xl font-black tabular-nums text-plate-foreground lg:text-6xl"
      >
        {{ error.statusCode }}
      </p>

      <div class="flex max-w-prose flex-col gap-3">
        <h1
          class="text-3xl font-extrabold tracking-tight text-balance lg:text-[2.5rem]"
        >
          {{ title }}
        </h1>
        <p v-if="missing" class="text-lg text-muted-foreground">
          <i18n-t keypath="error.page.missing_text" scope="global">
            <template #path>
              <span class="font-semibold break-all text-foreground">
                {{ route.path }}
              </span>
            </template>
          </i18n-t>
        </p>
        <p v-else class="text-lg text-muted-foreground">
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
        class="flex w-full flex-col gap-3 border-t pt-6"
      >
        <p class="text-sm font-bold">{{ $t('error.page.elsewhere') }}</p>
        <ul class="flex flex-wrap gap-x-8 gap-y-2">
          <li v-for="link in elsewhere" :key="link.to">
            <NuxtLink
              :to="localePath(link.to)"
              class="inline-flex items-center gap-1 font-semibold underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
            >
              {{ $t(link.label) }}
              <ArrowRight class="size-4" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </NuxtLayout>
</template>
