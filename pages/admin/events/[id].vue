<script setup lang="ts">
  import EventForm from '@/components/admin/form/EventForm.vue'

  interface StoredEvent {
    title?: string
    companyUID?: string
    description?: string
    location?: { name?: string; map?: string | null }
    date?: { start?: string; end?: string }
    capacity?: number | null
    registration?: {
      start?: string | null
      end?: string | null
      requirements?: {
        programmes?: string[] | null
        years?: number[] | null
      } | null
    } | null
  }

  const route = useRoute()
  const uid = String(route.params.id)
  const { data: events } = await useFetch<Record<string, StoredEvent>>(
    '/api/v1/event',
    { query: { eventUID: uid } },
  )
  const event = computed(() => events.value?.[uid])

  // the form's shape, from what v1 stores
  const initial = computed(() => {
    const e = event.value
    if (!e) return null
    return {
      signup: !!e.capacity,
      title: e.title,
      companyUID: e.companyUID,
      description: e.description ?? '',
      location: { name: e.location?.name ?? '', map: e.location?.map ?? '' },
      start: e.date?.start,
      end: e.date?.end,
      capacity: e.capacity ?? undefined,
      opens: e.registration?.start ?? undefined,
      closes: e.registration?.end ?? undefined,
      programmes: e.registration?.requirements?.programmes ?? [],
      years: (e.registration?.requirements?.years ?? []).map(Number),
    }
  })
</script>

<template>
  <EventForm v-if="initial" :uid="uid" :initial="initial" />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.events.form.missing') }}
  </p>
</template>
