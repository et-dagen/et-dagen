<script setup lang="ts">
  import { CalendarPlus, ScanLine, Ticket } from '@lucide/vue'
  import EventTicket from '@/components/event/page/EventTicket.vue'
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog'
  import { Button } from '@/components/ui/button'
  import { alertError } from '@/composables/useAlerts'
  import { Instant } from '@/domain/time'
  import type { SignupState } from '@/lib/eventPage'

  const props = defineProps<{
    eventUid: string
    state: SignupState
    places: { taken: number; limit: number | null; waiting: number }
    /** Whether today is the event's day, when the ticket comes first */
    eventDay: boolean
    calendar: string | null
    ticket: {
      uid: string
      name: string
      title: string
      when: string
      room: string | null
    } | null
    isAdmin: boolean
  }>()
  const emit = defineEmits<{ changed: [] }>()

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const alerts = useAlertStore()

  const busy = ref(false)
  async function send(method: 'POST' | 'DELETE', done: string) {
    busy.value = true
    try {
      await $fetch('/api/v1/event/register', {
        method,
        body: { eventUID: props.eventUid },
      })
      alerts.alert(t(done), 'success')
      emit('changed')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
    }
  }

  // the countdown ticks each minute, and the page refreshes the moment sign-up opens
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now()
      const opensAt = props.state.kind === 'not-open' && props.state.opensAt
      if (opensAt && Date.parse(opensAt) <= now.value) emit('changed')
    }, 30_000)
  })
  onBeforeUnmount(() => clearInterval(timer))
  const countdown = computed(() => {
    if (props.state.kind !== 'not-open' || !props.state.opensAt) return null
    const minutes = Math.max(
      0,
      Math.ceil((Date.parse(props.state.opensAt) - now.value) / 60_000),
    )
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    if (days > 0) return t('events.page.countdown.days', { days, hours })
    return t('events.page.countdown.hours', { hours, minutes: minutes % 60 })
  })
  const opensAtText = computed(() =>
    props.state.kind === 'not-open' && props.state.opensAt
      ? new Intl.DateTimeFormat(locale.value, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Oslo',
        }).format(Instant.toDate(props.state.opensAt))
      : '',
  )

  const showTicket = ref(false)
  const confirming = ref(false)

  function downloadCalendar() {
    if (!props.calendar) return
    const url = URL.createObjectURL(
      new Blob([props.calendar], { type: 'text/calendar' }),
    )
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: `${props.eventUid}.ics`,
    })
    link.click()
    URL.revokeObjectURL(url)
  }
</script>

<template>
  <section
    class="tw:flex tw:flex-col tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5"
    aria-labelledby="signup-heading"
  >
    <EventTicket
      v-if="ticket && state.kind === 'registered' && eventDay"
      v-bind="ticket"
      lead
    />

    <div>
      <h2 id="signup-heading" class="tw:text-xl tw:font-bold">
        {{
          $t(
            `events.page.state.${state.kind}`,
            state.kind === 'queued' ? { n: state.position } : {},
          )
        }}
      </h2>
      <p
        v-if="places.limit && (state.kind === 'open' || state.kind === 'full')"
        class="tw:text-sm tw:text-muted-foreground tw:tabular-nums"
      >
        {{
          state.kind === 'full'
            ? $t('events.page.waiting_count', places.waiting)
            : $t('events.page.left', places.limit - places.taken)
        }}
      </p>
    </div>

    <p
      v-if="countdown"
      class="tw:rounded-md tw:bg-muted tw:px-3 tw:py-2 tw:text-sm"
    >
      <span class="tw:font-semibold">{{ countdown }}</span>
      <span class="tw:block tw:text-muted-foreground">{{ opensAtText }}</span>
    </p>

    <Button
      v-if="state.kind === 'open' || state.kind === 'full'"
      size="lg"
      class="tw:w-full"
      :disabled="busy"
      @click="
        send(
          'POST',
          state.kind === 'open'
            ? 'events.page.done.registered'
            : 'events.page.done.queued',
        )
      "
    >
      {{
        $t(
          state.kind === 'open'
            ? 'events.page.action.register'
            : 'events.page.action.queue',
        )
      }}
    </Button>
    <Button
      v-else-if="state.kind === 'sign-in'"
      as-child
      size="lg"
      class="tw:w-full"
    >
      <NuxtLink :to="localePath('/user/signin')">
        {{ $t('events.page.action.sign_in') }}
      </NuxtLink>
    </Button>
    <p v-else-if="state.kind === 'not-eligible'" class="tw:text-sm">
      {{ $t('events.page.not_eligible') }}
    </p>

    <template v-if="state.kind === 'registered' || state.kind === 'queued'">
      <Button
        v-if="state.kind === 'registered' && !eventDay && ticket"
        variant="outline"
        class="tw:w-full"
        :aria-expanded="showTicket"
        @click="showTicket = !showTicket"
      >
        <Ticket aria-hidden="true" />
        {{
          $t(showTicket ? 'events.page.ticket.hide' : 'events.page.ticket.open')
        }}
      </Button>
      <EventTicket v-if="showTicket && ticket" v-bind="ticket" />
      <Button
        variant="ghost"
        class="tw:w-full tw:text-destructive tw:hover:bg-destructive/10 tw:hover:text-destructive"
        :disabled="busy"
        @click="confirming = true"
      >
        {{
          $t(
            state.kind === 'registered'
              ? 'events.page.action.cancel'
              : 'events.page.action.leave_queue',
          )
        }}
      </Button>
    </template>

    <Button
      v-if="calendar && state.kind !== 'past'"
      variant="outline"
      class="tw:w-full"
      @click="downloadCalendar"
    >
      <CalendarPlus aria-hidden="true" />
      {{ $t('events.page.action.calendar') }}
    </Button>

    <Button v-if="isAdmin" as-child variant="ghost" class="tw:w-full">
      <NuxtLink :to="localePath(`/event/${eventUid}/scan_attendants`)">
        <ScanLine aria-hidden="true" />
        {{ $t('event.page.attendants.scan') }}
      </NuxtLink>
    </Button>

    <AlertDialog v-model:open="confirming">
      <AlertDialogContent class="tw:rounded-md tw:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle class="tw:text-lg tw:font-bold">
            {{
              $t(
                state.kind === 'queued'
                  ? 'events.page.confirm.queue_title'
                  : 'events.page.confirm.title',
              )
            }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              $t(
                state.kind === 'queued'
                  ? 'events.page.confirm.queue_text'
                  : 'events.page.confirm.text',
              )
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{
            $t('events.page.confirm.keep')
          }}</AlertDialogCancel>
          <AlertDialogAction
            class="tw:bg-destructive tw:text-white tw:hover:bg-destructive/90"
            @click="send('DELETE', 'events.page.done.cancelled')"
          >
            {{
              $t(
                state.kind === 'queued'
                  ? 'events.page.action.leave_queue'
                  : 'events.page.action.cancel',
              )
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
</template>
