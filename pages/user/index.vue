<script setup lang="ts">
  import { CalendarDays, RotateCw } from '@lucide/vue'
  import PageTitle from '@/components/common/PageTitle.vue'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/admin/events'
  import {
    firstNameOf,
    signUpRows,
    ticketOf,
    type SignUp,
  } from '@/lib/user/signUps'
  import { Button } from '@/components/ui/button'

  definePageMeta({
    // route is protected
    protected: true,
  })

  const auth = useAuthStore()
  const localePath = useLocalePath()

  const [
    { data: signUps, error: signUpsError, refresh: refreshSignUps },
    { data: events, error: eventsError, refresh: refreshEvents },
  ] = await Promise.all([
    useFetch<SignUp[]>('/api/v1/user/events', {
      key: 'user-sign-ups',
      headers: useRequestHeaders(['cookie']),
    }),
    useFetch<Record<string, EventRow>>('/api/v1/event'),
  ])

  const now = Instant.now()
  const rows = computed(() => signUpRows(signUps.value, events.value, now))
  const ticket = computed(() => ticketOf(rows.value))

  // a failed load must not tell someone at the door that they have no ticket
  const failed = computed(() => !!signUpsError.value || !!eventsError.value)
  const retrying = ref(false)
  const refresh = async () => {
    retrying.value = true
    await Promise.all([refreshSignUps(), refreshEvents()])
    retrying.value = false
  }
</script>

<template>
  <div class="et-ui tw:bg-background tw:text-foreground">
    <div class="tw:mx-auto tw:max-w-6xl tw:px-4 tw:py-8 tw:lg:px-8 tw:lg:py-12">
      <PageTitle>
        {{ $t('user.page.hello', { name: firstNameOf(auth.user?.name) }) }}
      </PageTitle>

      <!-- events on the left, the user's own information on the right; a phone stacks them ticket first -->
      <div
        class="tw:mt-8 tw:grid tw:items-start tw:gap-x-10 tw:gap-y-14 tw:lg:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <section aria-labelledby="arrangementer-title" class="tw:min-w-0">
          <div
            class="tw:flex tw:min-h-10 tw:flex-wrap tw:items-center tw:justify-between tw:gap-3"
          >
            <h2
              id="arrangementer-title"
              class="tw:text-2xl tw:font-extrabold tw:tracking-tight"
            >
              {{ $t('user.page.events') }}
            </h2>
            <Button as-child variant="outline">
              <NuxtLink :to="localePath('/programme')">
                <CalendarDays aria-hidden="true" />
                {{ $t('user.page.programme') }}
              </NuxtLink>
            </Button>
          </div>

          <div
            v-if="failed"
            role="alert"
            class="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5"
          >
            <div>
              <p class="tw:font-bold">{{ $t('user.page.load_failed') }}</p>
              <p class="tw:mt-1 tw:text-sm tw:text-muted-foreground">
                {{ $t('user.page.load_failed_hint') }}
              </p>
            </div>
            <Button variant="outline" :disabled="retrying" @click="refresh()">
              <RotateCw aria-hidden="true" />
              {{ $t('user.page.retry') }}
            </Button>
          </div>
          <template v-else>
            <UserTicket
              v-if="ticket && auth.user"
              :row="ticket"
              :holder="auth.user.name ?? ''"
              :uid="auth.user.uid"
              class="tw:mt-4"
            />
            <div
              v-else
              class="tw:mt-4 tw:rounded-lg tw:border tw:border-dashed tw:bg-card tw:px-6 tw:py-10 tw:text-center"
            >
              <p class="tw:text-lg tw:font-bold">
                {{ $t('user.page.no_ticket') }}
              </p>
              <p class="tw:mt-1 tw:text-muted-foreground">
                {{ $t('user.page.no_ticket_hint') }}
              </p>
            </div>

            <div class="tw:mt-5 tw:rounded-lg tw:border tw:bg-card">
              <h3
                class="tw:flex tw:items-center tw:gap-3 tw:border-b tw:px-5 tw:py-4 tw:text-lg tw:font-extrabold tw:sm:px-6"
              >
                {{ $t('user.page.sign_ups') }}
                <span
                  class="tw:grid tw:min-w-7 tw:place-items-center tw:rounded-full tw:bg-plate tw:px-2 tw:pt-0.5 tw:text-sm tw:text-plate-foreground"
                >
                  {{ rows.length }}
                </span>
              </h3>
              <UserSignUps
                v-if="rows.length"
                :rows="rows"
                @withdrawn="refresh()"
              />
              <p
                v-else
                class="tw:px-5 tw:py-4 tw:text-muted-foreground tw:sm:px-6"
              >
                {{ $t('user.page.no_sign_ups') }}
              </p>
            </div>
          </template>
        </section>

        <section aria-labelledby="informasjon-title" class="tw:min-w-0">
          <div class="tw:flex tw:min-h-10 tw:items-center">
            <h2
              id="informasjon-title"
              class="tw:text-2xl tw:font-extrabold tw:tracking-tight"
            >
              {{ $t('user.page.information') }}
            </h2>
          </div>
          <UserDetails class="tw:mt-4" />
        </section>
      </div>
    </div>
  </div>
</template>
