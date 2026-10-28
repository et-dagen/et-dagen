<script setup lang="ts">
  import type { NuxtError } from '#app'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{ error: NuxtError }>()

  const localePath = useLocalePath()
  const { t } = useI18n()
  useHead({ title: () => t('error.page_error.title') })

  const handleError = () =>
    clearError({
      redirect: localePath('/'),
    })
</script>

<template>
  <div class="et-ui tw:min-h-screen">
    <div
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:items-start tw:gap-4 tw:px-4 tw:py-16 tw:lg:px-8"
    >
      <p class="tw:text-sm tw:font-bold tw:text-brand tw:tabular-nums">
        {{ $t('error.page_error.status', { code: props.error.statusCode }) }}
      </p>
      <h1 class="tw:text-2xl tw:font-bold">
        {{ $t('error.page_error.title') }}
      </h1>
      <p
        v-if="props.error.message"
        class="tw:break-words tw:text-muted-foreground"
      >
        {{ props.error.message }}
      </p>
      <Button variant="outline" @click="handleError">
        {{ $t('error.page_not_found.navigate_front_page') }}
      </Button>
    </div>
  </div>
</template>
