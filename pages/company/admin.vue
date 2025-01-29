<script setup lang="ts">
  import EventCard from '@/components/company/EditEventCard.vue'
  import ResumeList from '~/components/company/ResumeList.vue'
  // Define your data and methods here
  const toggle = ref('event')

  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    // route is only accessible by admins
    accessLevels: ['admin', 'company'],
  })

  // get all events accessible to the user
  const useAuth = useAuthStore()
  const { data } = await useFetch('/api/company/events', {
    method: 'GET',
    query: {
      companyUID: useAuth.user?.companyUID,
    },
  })
  const events = computed(() => embedKeyIntoObjectValues(data.value))

  // get all companies
  const { data: companies } = await useFetch('/api/company')

  // get all users
  const { data: users } = await useFetch('/api/user', {
    method: 'GET',
    query: {
      scope: 'all',
    },
  })
</script>

<template>
  <VContainer class="d-flex flex-column">
    <h4 class="text-center pt-4 pb-7">{{ $t('company.admin.title') }}</h4>

    <div class="d-flex flex-column w-full">
      <v-btn-toggle v-model="toggle" color="primary" mandatory>
        <v-btn icon="mdi-format-align-left" class="w-50 bg-white" value="event">
          <span class="text-sm">Arrangement</span>
        </v-btn>
        <v-btn icon="mdi-format-align-center" class="w-50 bg-gray" value="cv">
          CV
        </v-btn>
      </v-btn-toggle>
    </div>
    <div v-if="toggle === 'event'">
      <EventCard
        v-for="event in events"
        :key="event.uid"
        :event="event"
        :companies="companies"
        :users="users"
      />
    </div>
    <div v-else>
      <ResumeList :users="users" />
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  .v-container {
    max-width: 900px;
    gap: 1rem;
  }

  .v-card {
    position: relative;

    .edit-btn {
      position: absolute;
      top: 0;
      right: 0;
    }
    .v-icon {
      margin-right: 0.5rem;
    }

    p {
      display: flex;
      align-items: center;
    }

    ul {
      list-style: none;
    }
  }

  .restriction {
    &::after {
      content: ',\00a0';
    }
    &:last-child::after {
      content: '' !important;
    }
  }
</style>
