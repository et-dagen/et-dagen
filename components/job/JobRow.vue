<script setup lang="ts">
  import { MapPin } from '@lucide/vue'
  import CompanyLogo from '@/components/admin/CompanyLogo.vue'
  import DeadlineNote from '@/components/job/DeadlineNote.vue'
  import { placeOf } from '@/lib/admin/events'
  import { formatWhen } from '@/lib/admin/time'
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
    class="tw:group tw:grid tw:grid-cols-[auto_minmax(0,1fr)] tw:sm:grid-cols-[auto_minmax(0,1fr)_auto] tw:gap-x-3 tw:px-4 tw:py-4 tw:transition-colors tw:hover:bg-accent/60 tw:sm:gap-x-4 tw:sm:px-5"
  >
    <CompanyLogo :src="job.logo" :name="job.company" size="md" />
    <div class="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
      <h2
        class="tw:text-lg tw:leading-snug tw:font-bold tw:text-balance tw:group-hover:underline tw:group-hover:decoration-1 tw:group-hover:underline-offset-4"
      >
        {{ job.title }}
      </h2>
      <p
        class="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-0.5 tw:text-sm tw:text-muted-foreground"
      >
        <span class="tw:font-semibold tw:text-foreground">{{
          job.company
        }}</span>
        <span v-if="job.jobType">
          {{
            $t(`admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`)
          }}
        </span>
        <span
          v-if="job.location"
          class="tw:inline-flex tw:items-center tw:gap-1"
        >
          <MapPin class="tw:size-3.5" aria-hidden="true" />
          {{ job.location }}
        </span>
      </p>
      <p
        v-if="!job.deadline || job.state.kind === 'open'"
        class="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:sm:hidden"
      >
        {{
          job.deadline
            ? formatShortDeadline(job.deadline, locale)
            : $t('jobs.list.rolling')
        }}
        <DeadlineNote
          v-if="job.state.kind === 'open' && job.state.soon"
          :state="job.state"
        />
      </p>
      <p v-if="job.nextEvent" class="tw:text-sm tw:leading-relaxed">
        <span
          class="tw:mr-2 tw:inline-block tw:rounded-sm tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold"
          :class="
            place.code
              ? 'tw:bg-plate tw:text-plate-foreground'
              : 'tw:bg-muted tw:text-foreground'
          "
        >
          {{ place.code ?? place.name }}
        </span>
        <span class="tw:font-semibold tw:whitespace-nowrap">
          {{ $t('jobs.list.meet', { day: eventDay }) }}
        </span>
        <span class="tw:ml-1.5">{{ job.nextEvent.title }}</span>
      </p>
    </div>
    <div
      class="tw:hidden tw:flex-col tw:items-end tw:gap-1 tw:text-right tw:sm:flex"
    >
      <span
        class="tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:tabular-nums"
      >
        {{
          job.deadline
            ? formatShortDeadline(job.deadline, locale)
            : $t('jobs.list.rolling')
        }}
      </span>
      <DeadlineNote
        v-if="job.state.kind === 'open' && job.state.soon"
        :state="job.state"
      />
    </div>
  </NuxtLink>
</template>
