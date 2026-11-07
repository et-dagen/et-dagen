<script setup lang="ts">
  import FairDates from '@/components/admin/fair/FairDates.vue'
  import ProgrammeList from '@/components/admin/fair/ProgrammeList.vue'
  import type { GeneralInfo } from '@/lib/site/fair'
  import { programmeRows } from '@/lib/admin/programmes'

  const [{ data: info }, { data: programmes, refresh }] = await Promise.all([
    useFetch<GeneralInfo>('/api/v1/generalInfo'),
    useFetch<Parameters<typeof programmeRows>[0]>('/api/v1/programme', {
      key: 'programmes',
    }),
  ])
  const rows = computed(() => programmeRows(programmes.value))
</script>

<template>
  <div class="flex max-w-4xl flex-col gap-8">
    <FairDates :start="info?.date?.start" :end="info?.date?.end" />
    <ProgrammeList :rows="rows" @changed="refresh" />
  </div>
</template>
