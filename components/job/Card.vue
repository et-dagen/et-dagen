<script setup lang="ts">
  import { Separator } from '@/components/ui/separator'
  import { useDeadlineLabel } from '@/composables/useDeadlineLabel'
  import type { JobRow } from '@/lib/jobBoard'

  defineProps<{ job: JobRow }>()

  const localePath = useLocalePath()
  const deadlineLabel = useDeadlineLabel()
</script>

<template>
  <NuxtLink :to="localePath(`/jobs/${job.uid}`)" class="tw:block">
    <div
      class="tw:my-4 tw:flex tw:cursor-pointer tw:rounded-lg tw:shadow-md tw:transition-colors tw:duration-200 tw:hover:bg-[rgba(151,151,151,0.14)] tw:min-[960px]:px-7 tw:min-[960px]:py-3"
    >
      <img
        class="tw:m-2.5 tw:max-h-[125px] tw:w-[125px] tw:object-contain tw:min-[960px]:w-[175px]"
        :src="job.logo || '/images/logo_long.png'"
        :alt="job.company"
      />
      <Separator
        orientation="vertical"
        class="tw:my-2 tw:ml-2 tw:data-[orientation=vertical]:h-auto"
      />
      <div class="tw:min-w-0 tw:flex-1 tw:px-4 tw:py-2.5">
        <div
          class="tw:truncate tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
        >
          {{ job.title }}
        </div>
        <div
          class="tw:flex tw:justify-between tw:pb-1 tw:text-sm tw:leading-5 tw:tracking-[0.0178em] tw:opacity-60"
        >
          <span class="tw:mr-1 tw:truncate">
            <template v-if="job.jobType">
              {{
                $t(
                  `admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`,
                )
              }}
              -
            </template>
            {{ job.location }}
          </span>
          <span class="tw:hidden tw:shrink-0 tw:min-[600px]:flex">
            {{ $t('jobs.deadline') }}:
            {{ deadlineLabel(job.state, job.deadline) }}
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
