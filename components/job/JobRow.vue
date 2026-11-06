<script setup lang="ts">
  import { MapPin } from '@lucide/vue'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
  import DeadlineNote from '@/components/common/DeadlineNote.vue'
  import { placeOf } from '@/lib/events'
  import { formatWhen } from '@/lib/time'
  import type { JobRow } from '@/lib/jobBoard'
  import { formatShortDeadline } from '@/lib/jobs'

  const props = defineProps<{ job: JobRow }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const place = computed(() => placeOf(props.job.nextEvent?.location?.name))
  const eventDay = computed(() =>
    formatWhen(props.job.nextEvent?.date?.start, locale.value, {
      day: 'numeric',
      month: 'short',
    }),
  )
</script>

<template>
  <NuxtLink
    :to="localePath(`/jobs/${job.uid}`)"
    class="group grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 px-4 py-4 transition-colors hover:bg-accent/60 sm:gap-x-4 sm:px-5"
  >
    <CompanyLogo :src="job.logo" :name="job.company" size="md" />
    <div class="flex min-w-0 flex-col gap-1">
      <h2
        class="text-lg leading-snug font-bold text-balance group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
      >
        {{ job.title }}
      </h2>
      <p
        class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground"
      >
        <span class="font-semibold text-foreground">{{ job.company }}</span>
        <span v-if="job.jobType">
          {{
            $t(`admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`)
          }}
        </span>
        <span v-if="job.location" class="inline-flex items-center gap-1">
          <MapPin class="size-3.5" aria-hidden="true" />
          {{ job.location }}
        </span>
      </p>
      <p
        class="flex flex-wrap items-center gap-2 text-sm font-semibold sm:hidden"
      >
        <template v-if="job.state.kind === 'open'">
          {{ formatShortDeadline(job.deadline ?? undefined, locale) }}
        </template>
        <DeadlineNote :state="job.state" />
      </p>
      <p v-if="job.nextEvent" class="text-sm leading-relaxed">
        <span
          class="mr-2 inline-block rounded-sm px-1.5 pt-0.5 text-xs font-extrabold"
          :class="
            place.code
              ? 'bg-plate text-plate-foreground'
              : 'bg-muted text-foreground'
          "
        >
          {{ place.code ?? place.name }}
        </span>
        <span class="font-semibold whitespace-nowrap">
          {{ $t('jobs.list.meet', { day: eventDay }) }}
        </span>
        <span class="ml-1.5">{{ job.nextEvent.title }}</span>
      </p>
    </div>
    <div class="hidden flex-col items-end gap-1 text-right sm:flex">
      <span
        v-if="job.state.kind === 'open'"
        class="text-sm font-semibold whitespace-nowrap tabular-nums"
      >
        {{ formatShortDeadline(job.deadline ?? undefined, locale) }}
      </span>
      <DeadlineNote
        v-if="job.state.kind !== 'open' || job.state.soon"
        :state="job.state"
      />
    </div>
  </NuxtLink>
</template>
