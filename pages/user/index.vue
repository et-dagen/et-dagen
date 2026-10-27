<script setup lang="ts">
  import { CalendarDays } from '@lucide/vue'
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

  const [{ data: signUps, refresh }, { data: events }] = await Promise.all([
    useFetch<SignUp[]>('/api/v1/user/events', {
      key: 'user-sign-ups',
      headers: useRequestHeaders(['cookie']),
    }),
    useFetch<Record<string, EventRow>>('/api/v1/event'),
  ])

  const rows = computed(() => signUpRows(signUps.value, events.value))
  const ticket = computed(() => ticketOf(rows.value))
</script>

<template>
  <div class="et-ui tw:bg-background tw:text-foreground">
    <div
      class="tw:mx-auto tw:grid tw:max-w-screen-xl tw:gap-10 tw:px-4 tw:py-10 tw:lg:grid-cols-[14rem_minmax(0,1fr)] tw:lg:px-8 tw:lg:py-14"
    >
      <aside class="tw:hidden tw:lg:block">
        <UserRail class="tw:sticky tw:top-24" />
      </aside>

      <div class="tw:min-w-0">
        <h1 class="tw:text-4xl tw:font-black tw:tracking-tight tw:lg:text-5xl">
          {{ $t('user.page.hello', { name: firstNameOf(auth.user?.name) }) }}
        </h1>

        <!-- on a phone the two parts of the page are one tap away -->
        <nav
          :aria-label="$t('user.page.sections')"
          class="tw:mt-6 tw:grid tw:grid-cols-2 tw:rounded-lg tw:border tw:bg-card tw:p-1 tw:lg:hidden"
        >
          <a
            href="#arrangementer"
            class="tw:rounded-md tw:px-3 tw:py-2 tw:text-center tw:text-sm tw:font-bold tw:hover:bg-muted"
          >
            {{ $t('user.page.events') }}
          </a>
          <a
            href="#informasjon"
            class="tw:rounded-md tw:px-3 tw:py-2 tw:text-center tw:text-sm tw:font-bold tw:hover:bg-muted"
          >
            {{ $t('user.page.information') }}
          </a>
        </nav>

        <section
          id="arrangementer"
          aria-labelledby="arrangementer-title"
          class="tw:mt-10 tw:scroll-mt-24"
        >
          <div
            class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3"
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

          <div id="billett" class="tw:mt-5 tw:scroll-mt-24">
            <UserTicket
              v-if="ticket && auth.user"
              :row="ticket"
              :holder="auth.user.name ?? ''"
              :uid="auth.user.uid"
            />
            <div
              v-else
              class="tw:rounded-lg tw:border tw:border-dashed tw:bg-card tw:px-6 tw:py-10 tw:text-center"
            >
              <p class="tw:text-lg tw:font-bold">
                {{ $t('user.page.no_ticket') }}
              </p>
              <p class="tw:mt-1 tw:text-muted-foreground">
                {{ $t('user.page.no_ticket_hint') }}
              </p>
            </div>
          </div>

          <div id="pameldinger" class="tw:mt-8 tw:scroll-mt-24">
            <h3
              class="tw:flex tw:items-center tw:gap-2 tw:text-lg tw:font-bold"
            >
              {{ $t('user.page.sign_ups') }}
              <span
                class="tw:grid tw:min-w-6 tw:place-items-center tw:rounded-full tw:bg-plate tw:px-2 tw:pt-0.5 tw:text-sm tw:text-plate-foreground"
              >
                {{ rows.length }}
              </span>
            </h3>
            <UserSignUps
              v-if="rows.length"
              :rows="rows"
              class="tw:mt-3"
              @withdrawn="refresh()"
            />
            <p v-else class="tw:mt-2 tw:text-muted-foreground">
              {{ $t('user.page.no_sign_ups') }}
            </p>
          </div>
        </section>

        <section
          id="informasjon"
          aria-labelledby="informasjon-title"
          class="tw:mt-16 tw:scroll-mt-24 tw:border-t tw:pt-10"
        >
          <h2
            id="informasjon-title"
            class="tw:text-2xl tw:font-extrabold tw:tracking-tight"
          >
            {{ $t('user.page.information') }}
          </h2>
          <UserDetails class="tw:mt-5" />
        </section>

        <section
          id="konto"
          aria-labelledby="konto-title"
          class="tw:mt-16 tw:scroll-mt-24 tw:border-t tw:pt-10"
        >
          <h2
            id="konto-title"
            class="tw:text-2xl tw:font-extrabold tw:tracking-tight"
          >
            {{ $t('user.page.account') }}
          </h2>
          <UserDeleteAccount class="tw:mt-5" />
        </section>
      </div>
    </div>
  </div>
</template>
