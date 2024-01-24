<script setup lang="ts">
  // get job id from route
  const route = useRoute()
  const jobUID = route.params.id

  // fetch job information from query
  const { data } = await useFetch('/api/job', {
    query: {
      jobUID,
    },
  })

  // fetch all companies
  const { data: companies } = await useFetch('/api/company')

  // embed uid into object
  const job = computed(() => embedKeyIntoObjectValues(data.value)[0])

  // get company information
  const company = computed(() => companies.value[job.value.companyUID] || null)

  const date = computed(() => new Date(job.value.deadline))
</script>

<template>
  <VContainer class="container">
    <!-- company logo -->
    <VCard
      class="d-flex justify-center align-center pa-4 image-container"
      flat
      rounded="lg"
    >
      <NuxtImg
        class="image"
        fit="contain"
        :src="company?.logo || 'images/logo_long.png'"
      />
    </VCard>

    <!-- job description -->
    <VCard class="description elevation-4" rounded="lg">
      <VCardTitle class="title">{{ job?.title }}</VCardTitle>
      <VCardText class="text">{{ job?.description }}</VCardText>
    </VCard>

    <!-- job details -->
    <VCard class="details elevation-4" rounded="lg">
      <VCardTitle class="details__title">
        {{ $t('jobs.details') }}
      </VCardTitle>

      <VCardText class="details__from pt-5 pb-5">
        <strong>{{ $t('jobs.deadline') }}:</strong>
        {{ date.getDate() }}.
        {{ $t(`datetime.months.${getFullMonthFromNumber(date.getMonth())}`) }}
        {{ date.getFullYear() }}
      </VCardText>

      <VCardText class="details__location py-0 pb-5">
        <strong>{{ $t('jobs.location') }}:</strong>
        {{ job.location }}
      </VCardText>

      <VCardText class="details__host py-0 pb-5">
        <strong>{{ $t('jobs.company') }}: </strong>
        <NuxtLink v-if="company" :to="company?.webpage" target="_blank">
          {{ company?.name }}
          <VIcon size="xsmall" color="primary">mdi-open-in-new</VIcon>
        </NuxtLink>

        <span v-else>{{ 'E&T-dagene' }}</span>
      </VCardText>
    </VCard>

    <!-- apply for job -->
    <div class="attendant-container">
      <div>
        <VBtn
          color="primary"
          block
          :ripple="true"
          density="comfortable"
          @click="
            // TODO: add link for applying to jobs
            navigateTo('/', {
              external: true,
              open: { target: '_blank' },
            })
          "
        >
          {{ $t('jobs.apply') }}!
        </VBtn>
      </div>
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';
  .container {
    display: grid;
    width: 100vw;
    grid-template-columns: 1fr 3fr;
    gap: 1rem;
    grid-template-areas: 'details image' 'attendants description';

    .image-container {
      max-height: 300px;

      .image {
        width: 100%;
      }
    }

    .description {
      grid-area: description;
    }
    .details {
      grid-area: details;
    }

    .attendant-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .attendants {
      grid-area: attendants;
    }

    @media #{map-get(settings.$display-breakpoints, 'lg-and-up')} {
      max-width: 1080px;
    }

    @media #{map-get(settings.$display-breakpoints, 'md-and-down')} {
      max-width: 750px;
      grid-template-areas: 'image' 'details' 'attendants' 'description';
      grid-template-columns: 1fr;
    }

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      max-width: 420px;
    }
  }
</style>