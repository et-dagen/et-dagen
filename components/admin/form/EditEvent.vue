<script setup lang="ts">
  import EventForm from '@/components/admin/form/EventForm.vue'
  import { eventFormOf, type StoredEvent } from '@/lib/admin/eventForm'

  const props = defineProps<{ uid: string; panel?: string }>()

  const { data: events } = await useFetch<Record<string, StoredEvent>>(
    '/api/v1/event',
    { query: { eventUID: props.uid } },
  )
  const event = computed(() => events.value?.[props.uid])
</script>

<template>
  <EventForm
    v-if="event"
    :uid="uid"
    :initial="eventFormOf(event)"
    :panel="panel"
  />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.events.form.missing') }}
  </p>
</template>
