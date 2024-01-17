<script setup lang="ts">
  const localePath = useLocalePath()

  export interface Job {
    jobUID: string
    title: string
    description: string
    companyName: string
    companyLogo: string
    jobType: string
    location: string
    deadline: string
  }

  const props = defineProps<Job>()

  const date = computed(() => new Date(props.deadline))
</script>

<template>
  <div
    class="job-wrapper d-flex rounded-lg"
    @click="navigateTo(localePath(`/jobs/${jobUID}`))"
  >
    <NuxtImg :src="companyLogo" />
    <VDivider vertical class="my-2 ml-2" />
    <VCard
      class="flex-grow-1"
      flat
      :subtitle="
        $t(`admin.jobs.attributes.jobtype.${jobType.replace('-', '_')}`)
      "
    >
      <template #title>
        {{ title }}
      </template>

      <template #subtitle>
        <div class="d-flex justify-space-between">
          <span class="title mr-1">
            {{
              $t(`admin.jobs.attributes.jobtype.${jobType.replace('-', '_')}`)
            }}
          </span>
          <span class="d-none d-sm-flex">
            {{ $t('jobs.deadline') }}: {{ date.getDate() }}.
            {{
              $t(`datetime.months.${getFullMonthFromNumber(date.getMonth())}`)
            }}
          </span>
        </div>
      </template>

      <p class="px-4 mb-4 text-subtitle-2">{{ description }}</p>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  img {
    object-fit: contain;
    margin: 0.625rem;
    width: 175px;
    max-height: 125px;

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 125px;
    }
  }

  .v-card {
    background-color: transparent;

    > p {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
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
