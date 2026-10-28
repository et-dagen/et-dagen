<script setup lang="ts">
  import { ArrowRight } from '@lucide/vue'

  const localePath = useLocalePath()
  const paths = [
    { key: 'student', type: 'student' },
    { key: 'company', type: 'company' },
  ] as const
</script>

<template>
  <section aria-labelledby="paths-heading" class="tw:flex tw:flex-col tw:gap-3">
    <h2 id="paths-heading" class="tw:text-lg tw:font-extrabold">
      {{ $t('signin.paths.heading') }}
    </h2>
    <ul class="tw:grid tw:grid-cols-1 tw:gap-3 tw:min-[400px]:grid-cols-2">
      <li v-for="path in paths" :key="path.key">
        <NuxtLink
          :to="localePath({ path: '/user/signup', query: { type: path.type } })"
          class="tw:group tw:flex tw:h-full tw:flex-col tw:gap-1 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:transition-colors tw:outline-none tw:hover:border-plate tw:focus-visible:ring-2 tw:focus-visible:ring-brand"
        >
          <span class="tw:font-extrabold">
            {{ $t(`signin.paths.${path.key}.name`) }}
          </span>
          <span class="tw:text-sm tw:text-muted-foreground">
            {{ $t(`signin.paths.${path.key}.text`) }}
          </span>
          <span
            class="tw:mt-auto tw:flex tw:items-center tw:gap-1.5 tw:pt-2 tw:text-sm tw:font-bold tw:text-brand"
          >
            {{ $t(`signin.paths.${path.key}.link`) }}
            <ArrowRight
              class="tw:size-4 tw:transition-transform tw:group-hover:translate-x-0.5 tw:motion-reduce:transition-none"
              aria-hidden="true"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
