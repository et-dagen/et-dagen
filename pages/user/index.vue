<script setup lang="ts">
  import { CalendarDays, RotateCw } from '@lucide/vue'
  import UserDetails from '@/components/user/Details.vue'
  import SignUps from '@/components/user/SignUps.vue'
  import Ticket from '@/components/user/Ticket.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
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
  <div class="et-ui bg-background text-foreground">
    <div class="mx-auto max-w-screen-xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 class="text-4xl font-black tracking-tight lg:text-5xl">
        {{ $t('user.page.hello', { name: firstNameOf(auth.user?.name) }) }}
      </h1>

      <!-- events on the left, the user's own information on the right; a phone stacks them ticket first -->
      <div
        class="mt-8 grid items-start gap-x-10 gap-y-14 lg:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <section aria-labelledby="arrangementer-title" class="min-w-0">
          <div
            class="flex min-h-10 flex-wrap items-center justify-between gap-3"
          >
            <h2
              id="arrangementer-title"
              class="text-2xl font-extrabold tracking-tight"
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
            class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-5"
          >
            <div>
              <p class="font-bold">{{ $t('user.page.load_failed') }}</p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ $t('user.page.load_failed_hint') }}
              </p>
            </div>
            <Button variant="outline" :disabled="retrying" @click="refresh()">
              <RotateCw aria-hidden="true" />
              {{ $t('user.page.retry') }}
            </Button>
          </div>
          <template v-else>
            <Ticket
              v-if="ticket && auth.user"
              :row="ticket"
              :holder="auth.user.name ?? ''"
              :uid="auth.user.uid"
              class="mt-4"
            />
            <div
              v-else
              class="mt-4 rounded-lg border border-dashed bg-card px-6 py-10 text-center"
            >
              <p class="text-lg font-bold">
                {{ $t('user.page.no_ticket') }}
              </p>
              <p class="mt-1 text-muted-foreground">
                {{ $t('user.page.no_ticket_hint') }}
              </p>
            </div>

            <div class="mt-5 rounded-lg border bg-card">
              <h3
                class="flex items-center gap-3 border-b px-5 py-4 text-lg font-extrabold sm:px-6"
              >
                {{ $t('user.page.sign_ups') }}
                <span
                  class="grid min-w-7 place-items-center rounded-full bg-plate px-2 pt-0.5 text-sm text-plate-foreground"
                >
                  {{ rows.length }}
                </span>
              </h3>
              <SignUps v-if="rows.length" :rows="rows" @withdrawn="refresh()" />
              <p v-else class="px-5 py-4 text-muted-foreground sm:px-6">
                {{ $t('user.page.no_sign_ups') }}
              </p>
            </div>
          </template>
        </section>

        <section aria-labelledby="informasjon-title" class="min-w-0">
          <div class="flex min-h-10 items-center">
            <h2
              id="informasjon-title"
              class="text-2xl font-extrabold tracking-tight"
            >
              {{ $t('user.page.information') }}
            </h2>
          </div>
          <UserDetails class="mt-4" />
        </section>
      </div>
    </div>
  </div>
</template>
