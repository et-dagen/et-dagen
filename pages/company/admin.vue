<script setup lang="ts">
  import EventCard from '@/components/company/EditEventCard.vue'
  import ResumeList from '~/components/company/ResumeList.vue'

  const localePath = useLocalePath()

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

  const numberOfAttendants = computed(() => {
    return (event: any) => {
      return Object.keys(event?.attendants || {}).length
    }
  })
  // get all attendants for an event
  const eventAttandantList = computed(() => {
    return (event: any) => {
      return users.value.filter((user: any) =>
        Object.values(event?.attendants || {}).includes(user.uid),
      )
    }
  })
  // get all dietary restrictions for an event
  const dietaryRestrictions = computed(() => {
    return (event: any) => {
      const restrictions = {}
      const attendants = eventAttandantList.value(event)
      if (!attendants) return {}
      for (const attendant of attendants) {
        if (!attendant.dietaryRestrictions) continue
        attendant.dietaryRestrictions.forEach((restriction: string) => {
          if (Object.hasOwn(restrictions, restriction)) {
            restrictions[restriction] += 1
          } else {
            restrictions[restriction] = 1
          }
        })
      }
      return restrictions
    }
  })
  // get i18n name of dietary restriction
  const getRestrictionName = computed(() => {
    const nuxtApp = useNuxtApp()
    return (restriction: string) => {
      const name = nuxtApp.$i18n.t(`dietary_restrictions.${restriction}`)
      if (name.includes('dietary_restrictions')) return restriction
      return name
    }
  })
  // check if event has any dietary restrictions
  const hasRestrictions = computed(() => {
    return (event: any) => {
      return Object.entries(dietaryRestrictions.value(event)).length > 0
    }
  })
</script>

<template>
  <VContainer class="d-flex flex-column">
    <h4 class="text-center pt-4 pb-7">{{ $t('company.admin.title') }}</h4>
    <div class="d-flex flex-column w-full">
      <v-btn-toggle v-model="toggle" color="primary" mandatory>
        <v-btn icon="mdi-format-align-left" class="w-50 bg-white" value="event">
          <span class="text-sm">{{ $t('company.admin.event') }} </span>
        </v-btn>
        <v-btn icon="mdi-format-align-center" class="w-50 bg-gray" value="cv">
          <span class="text-sm">{{ $t('company.admin.resume') }} </span>
        </v-btn>
      </v-btn-toggle>
    </div>
    <div v-if="toggle === 'event'">
      <!-- edit event -->
      <EventCard
        v-for="event in events"
        :key="event.uid"
        :event="event"
        :companies="companies"
        :users="users"
        :number-of-attendants="numberOfAttendants"
        :has-restrictions="hasRestrictions"
        :get-restriction-name="getRestrictionName"
        :locale-path="localePath"
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
