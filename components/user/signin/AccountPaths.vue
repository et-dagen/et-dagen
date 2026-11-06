<script setup lang="ts">
  import { ArrowRight } from '@lucide/vue'

  const localePath = useLocalePath()
  const paths = [
    { key: 'student', type: 'student' },
    { key: 'company', type: 'company' },
  ] as const
</script>

<template>
  <section aria-labelledby="paths-heading" class="flex flex-col gap-3">
    <h2 id="paths-heading" class="text-lg font-extrabold">
      {{ $t('signin.paths.heading') }}
    </h2>
    <ul class="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
      <li v-for="path in paths" :key="path.key">
        <NuxtLink
          :to="localePath({ path: '/user/signup', query: { type: path.type } })"
          class="group flex h-full flex-col gap-1 rounded-lg border bg-card p-4 transition-colors outline-none hover:border-plate focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span class="font-extrabold">
            {{ $t(`signin.paths.${path.key}.name`) }}
          </span>
          <span class="text-sm text-muted-foreground">
            {{ $t(`signin.paths.${path.key}.text`) }}
          </span>
          <span
            class="mt-auto flex items-center gap-1.5 pt-2 text-sm font-bold text-brand"
          >
            {{ $t(`signin.paths.${path.key}.link`) }}
            <ArrowRight
              class="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
