<script setup lang="ts">
  import { dietaryFlags } from '~/config/app.config'
  const localePath = useLocalePath()
  const { text, copy, copied } = useClipboard()

  definePageMeta({
    // route and all sub routes are protected
    protected: true,
    // route is only accessible by admins
    accessLevels: ['admin', 'company'],
  })

  // get all companies
  const { data: companies } = await useFetch('/api/company')

  // get all events accessible to the user
  const useAuth = useAuthStore()
  const { data } = await useFetch('/api/company/events', {
    method: 'GET',
    query: {
      companyUID: useAuth.user?.companyUID,
    },
  })
  const events = computed(() => embedKeyIntoObjectValues(data.value))

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
        <v-btn icon="mdi-format-align-left" class="w-50 bg-white" value="left">
          Mine arrangement
        </v-btn>
        <v-btn
          icon="mdi-format-align-center"
          class="w-50 bg-gray"
          value="center"
        >
          CV
        </v-btn>
      </v-btn-toggle>
      <pre class="pt-2">{{ toggle }}</pre>
    </div>

    <!-- edit event -->
    <VCard v-for="event in events" :key="event.uid" elevation="3">
      <VBtn
        color="primary"
        variant="text"
        class="edit-btn ma-4"
        size="small"
        icon="mdi-pencil"
        @click="navigateTo(localePath(`/event/edit/${event.uid}`))"
      />

      <template #title>
        {{ event.title }}
      </template>

      <template #subtitle>
        {{ companies[event.companyUID]?.name || 'E&T-dagene' }}
      </template>

      <!-- content -->
      <template #text>
        <!-- date -->
        <p>
          <VIcon size="small" color="primary">mdi-calendar</VIcon>
          {{ getDayAndMonthString(event.date.start) }}
        </p>

        <!-- time -->
        <p>
          <VIcon size="small" color="primary">mdi-clock</VIcon>
          {{ getHourAndMinuteStringFromString(event.date.start) }}
          -
          {{ getHourAndMinuteStringFromString(event.date.end) }}
        </p>

        <!-- location -->
        <NuxtLink
          v-if="event.location.map"
          :to="event.location.map"
          target="_blank"
        >
          <VIcon size="small" color="primary">mdi-map</VIcon>
          {{ event.location.name }}
          <VIcon size="xsmall" color="primary">mdi-open-in-new</VIcon>
        </NuxtLink>
        <p v-else>
          <VIcon size="small" color="primary">mdi-map</VIcon>
          {{ event.location.name }}
        </p>

        <!-- registration -->
        <p v-if="event.capacity">
          <VIcon size="small" color="primary">mdi-lock-open-variant</VIcon>
          {{ getDayAndMonthString(event.registration.start) }}
          {{ getHourAndMinuteStringFromString(event.registration.start) }} -
          {{ getDayAndMonthString(event.registration.end) }}
          {{ getHourAndMinuteStringFromString(event.registration.end) }}
        </p>

        <!-- capacity -->
        <p v-if="event.capacity">
          <VIcon size="small" color="primary">mdi-account</VIcon>
          {{ numberOfAttendants(event) }} /
          {{ event.capacity }}
        </p>

        <!-- dietary restrictions and attandants -->
        <VExpansionPanels v-if="event.attendants" multiple class="mt-6">
          <!-- restrictions -->
          <VExpansionPanel
            v-if="hasRestrictions(event)"
            :title="$t('company.admin.dietaryrestrictions')"
          >
            <template #text>
              <p
                v-for="(i, restriction) in dietaryRestrictions(event)"
                :key="restriction"
              >
                <VIcon size="small" color="primary">
                  {{
                    dietaryFlags.find((e) => e.name === restriction)?.icon ||
                    'mdi-help'
                  }}
                </VIcon>
                {{ i }} x {{ getRestrictionName(restriction) }}
              </p>
            </template>
          </VExpansionPanel>

          <!-- attendants -->
          <VExpansionPanel :title="$t('company.admin.attendants')">
            <template #text>
              <VTable hover class="mb-5">
                <thead>
                  <tr>
                    <th>{{ $t('company.admin.user.attributes.name') }}</th>
                    <th>
                      {{ $t('company.admin.user.attributes.studyprogramme') }}
                    </th>
                    <th>
                      {{ $t('company.admin.user.attributes.currentyear') }}
                    </th>
                    <th>
                      {{ $t('company.admin.user.attributes.email') }}
                    </th>
                    <th>{{ $t('company.admin.dietaryrestrictions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in eventAttandantList(event)"
                    :key="user?.uid"
                  >
                    <td>{{ user.name }}</td>
                    <td>{{ user.studyProgram }}</td>
                    <td>{{ user.currentYear }}</td>
                    <td>
                      <VTooltip location="top" color="primary">
                        <template #activator="{ props }">
                          <VBtn
                            v-bind="props"
                            size="small"
                            variant="text"
                            icon="mdi-content-copy"
                            color="primary"
                            @click="copy(user.email)"
                          />
                        </template>

                        {{
                          copied && text === user.email
                            ? $t('company.admin.copiedemail')
                            : user.email
                        }}
                      </VTooltip>
                    </td>
                    <td>
                      <span
                        v-if="user?.dietaryRestrictions"
                        class="ml-2 text-error"
                      >
                        <i
                          v-for="restriction in user?.dietaryRestrictions"
                          :key="user.uid + restriction"
                          class="restriction"
                          >{{ getRestrictionName(restriction) }}</i
                        >
                      </span>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </template>
          </VExpansionPanel>
        </VExpansionPanels>
      </template>
    </VCard>
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
