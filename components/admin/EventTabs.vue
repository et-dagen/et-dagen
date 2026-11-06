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
  <nav :aria-label="$t('admin.events.tabs.label')" class="border-b">
    <ul class="flex gap-6">
      <li v-for="tab in tabs" :key="tab.to">
        <NuxtLink
          :to="localePath(tab.to)"
          :aria-current="isCurrent(tab.to) ? 'page' : undefined"
          class="-mb-px inline-flex h-10 items-center border-b-2 border-transparent pt-0.5 font-semibold text-muted-foreground hover:text-foreground aria-[current=page]:border-brand aria-[current=page]:text-foreground"
        >
          {{ $t(tab.label) }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
