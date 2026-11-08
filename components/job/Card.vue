<script setup lang="ts">
  import { useDeadlineLabel } from '@/composables/useDeadlineLabel'
  import type { JobRow } from '@/lib/jobBoard'

  defineProps<{ job: JobRow }>()

  const localePath = useLocalePath()
  const deadlineLabel = useDeadlineLabel()
</script>

<template>
  <NuxtLink :to="localePath(`/jobs/${job.uid}`)">
    <div class="job-wrapper d-flex rounded-lg elevation-2 px-md-7 py-md-3 my-4">
      <img :src="job.logo || '/images/logo_long.png'" :alt="job.company" />
      <VDivider vertical class="my-2 ml-2" />
      <VCard class="flex-grow-1" flat>
        <template #title>
          {{ job.title }}
        </template>

        <template #subtitle>
          <div class="d-flex justify-space-between">
            <span class="title mr-1">
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
            <span class="d-none d-sm-flex">
              {{ $t('jobs.deadline') }}:
              {{ deadlineLabel(job.state, job.deadline) }}
            </span>
          </div>
        </template>
      </VCard>
    </div>
  </NuxtLink>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  img {
    object-fit: contain;
    margin: 0.625rem;
    width: 175px;
    max-height: 125px;

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 125px;
    }
  }

  .v-card {
    background-color: transparent;
  }

  .job-wrapper {
    cursor: pointer;
    transition: 0.2s;

    &:hover {
      background-color: rgba(151, 151, 151, 0.14);
    }
  }

  .title {
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
