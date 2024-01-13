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

  defineProps<Job>()
</script>

<template>
  <div
    class="job-wrapper d-flex rounded-lg"
    @click="navigateTo(localePath(`/jobs/${jobUID}`))"
  >
    <NuxtImg width="200" height="100" :src="companyLogo" />
    <VCard
      class="ml-5 flex-grow-1"
      flat
      :subtitle="
        $t(`admin.jobs.attributes.jobtype.${jobType.replace('-', '_')}`)
      "
    >
      <template #title>
        <div class="d-flex justify-space-between">
          <span class="title mr-1"> {{ title }}</span>
          <span class="d-none d-sm-flex">
            {{ getDateFromDatetime(deadline) }}</span
          >
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
    align-self: start;
    margin: 0.625rem;

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
    transition: 0.3s;

    &:hover {
      background-color: rgba(151, 151, 151, 0.14);
    }
  }

  .title {
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
