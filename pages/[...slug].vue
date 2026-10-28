<script setup lang="ts">
  import { Button } from '@/components/ui/button'

  const localePath = useLocalePath()
  const route = useRoute()
  const { t } = useI18n()
  useHead({ title: () => t('error.page_not_found.page_doesnt_exist') })

  // answer with 404, so search engines do not index missing pages
  const event = useRequestEvent()
  if (event) setResponseStatus(event, 404)
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:items-start tw:gap-4 tw:px-4 tw:py-16 tw:lg:px-8"
    >
      <p class="tw:text-sm tw:font-bold tw:text-brand tw:tabular-nums">404</p>
      <h1 class="tw:text-2xl tw:font-bold">
        {{ $t('error.page_not_found.page_doesnt_exist') }}
      </h1>
      <p class="tw:break-all tw:text-muted-foreground">{{ route.path }}</p>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/')">{{
          $t('error.page_not_found.navigate_front_page')
        }}</NuxtLink>
      </Button>
    </div>
  </div>
</template>
