<script setup lang="ts">
  const props = defineProps<{ uid: string }>()

  const localePath = useLocalePath()
  const route = useRoute()
  const tabs = computed(() => [
    { label: 'admin.events.tabs.details', to: `/admin/events/${props.uid}` },
    {
      label: 'admin.events.tabs.attendees',
      to: `/admin/events/${props.uid}/attendees`,
    },
  ])
  const isCurrent = (to: string) => route.path === localePath(to)
</script>

<template>
  <nav :aria-label="$t('admin.events.tabs.label')" class="tw:border-b">
    <ul class="tw:flex tw:gap-6">
      <li v-for="tab in tabs" :key="tab.to">
        <NuxtLink
          :to="localePath(tab.to)"
          :aria-current="isCurrent(tab.to) ? 'page' : undefined"
          class="tw:-mb-px tw:inline-flex tw:h-10 tw:items-center tw:border-b-2 tw:border-transparent tw:pt-0.5 tw:font-semibold tw:text-muted-foreground tw:hover:text-foreground tw:aria-[current=page]:border-brand tw:aria-[current=page]:text-foreground"
        >
          {{ $t(tab.label) }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
