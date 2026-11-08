<script setup lang="ts">
  import {
    Camera,
    CalendarClock,
    CalendarPlus,
    CircleCheck,
    LoaderCircle,
    LogIn,
  } from '@lucide/vue'
  import EventTicket from '@/components/event/page/EventTicket.vue'
  import { Button } from '@/components/ui/button'
  import { Card, CardTitle } from '@/components/ui/card'
  import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog'
  import { Separator } from '@/components/ui/separator'
  import { alertError, notify } from '@/composables/useAlerts'
  import { Instant } from '@/domain/time'
  import { countdownOf, type SignupState } from '@/lib/eventPage'

  const props = defineProps<{
    eventUid: string
    state: SignupState
    places: { taken: number; limit: number | null; waiting: number }
    /** Who may sign up; programmes by name, empty when anyone may */
    requirements: { years: number[]; programmes: string[] }
    calendar: string | null
    /** The signed-in user's uid, which their ticket's code carries */
    ticketUid: string | null
    /** Whether the viewer takes attendance at this event */
    mayScan: boolean
  }>()
  const emit = defineEmits<{ changed: [] }>()

  const { t } = useI18n()
  const localePath = useLocalePath()

  const busy = ref(false)
  const confirming = ref(false)
  async function send(method: 'POST' | 'DELETE', done: string) {
    busy.value = true
    try {
      await $fetch('/api/v1/event/register', {
        method,
        body: { eventUID: props.eventUid },
      })
      notify(t(done), 'success')
      emit('changed')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
      confirming.value = false
    }
  }

  // the countdown ticks while the page is open, and the page refreshes the moment sign-up opens
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
    const { days, hours, minutes } = countdownOf(
      props.state.opensAt,
      Instant.of(new Date(now.value)),
    )
    if (days > 0) return t('events.page.countdown.days', { days, hours })
    return t('events.page.countdown.hours', { hours, minutes })
  })

  const closed = computed(() =>
    ['not-open', 'closed', 'past'].includes(props.state.kind),
  )

  // a disabled sign-up button greys out instead of fading, so it reads as unavailable
  const signUpClass = [
    'tw:h-11 tw:w-full tw:rounded-[4px] tw:bg-[#2BA84A] tw:px-6 tw:text-lg',
    'tw:tracking-[0.0892857em] tw:text-white tw:hover:bg-[#2BA84A]/90',
    'tw:disabled:bg-black/12 tw:disabled:text-black/26 tw:disabled:opacity-100',
  ]

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
  <div class="tw:flex tw:flex-col tw:gap-4">
    <Card
      class="tw:gap-0 tw:rounded-lg tw:border-0 tw:bg-brand tw:py-0 tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178571em] tw:text-white tw:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14),0_1px_10px_0_rgba(0,0,0,0.12)]"
    >
      <CardTitle
        class="tw:truncate tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
      >
        {{ $t('event.page.attendants.name') }}
      </CardTitle>

      <div
        v-if="places.limit"
        class="tw:flex tw:flex-wrap tw:justify-between tw:px-4 tw:pb-4"
      >
        <span>
          <strong class="tw:font-bold"
            >{{ $t('event.page.attendants.attendants') }}:
          </strong>
          {{ places.taken }} / {{ places.limit }}

          <strong class="tw:ml-2.5 tw:font-bold">
            {{ $t('event.page.queue.name') }}:
          </strong>
          {{ places.waiting }}
        </span>

        <span v-if="state.kind === 'registered'">
          {{ $t('event.page.attendants.registered') }}
          <CircleCheck
            class="tw:inline tw:size-5 tw:align-[-5px] tw:fill-white tw:text-brand"
          />
        </span>

        <div v-if="state.kind === 'queued'">
          {{ $t('event.page.queue.position') }}:
          {{ state.position }}
        </div>
      </div>

      <div v-else class="tw:px-4 tw:pb-4">
        {{ $t('event.page.attendants.nocapacity') }}
      </div>

      <div
        v-if="requirements.years.length"
        class="tw:flex tw:flex-wrap tw:px-4 tw:pb-5"
      >
        <strong class="tw:mr-2 tw:font-bold"
          >{{ $t('event.page.details.reg_year') }}:
        </strong>
        <span>{{ requirements.years.join(', ') }}</span>
      </div>

      <div
        v-if="requirements.programmes.length"
        class="tw:flex tw:flex-col tw:px-4 tw:pb-5"
      >
        <strong class="tw:mr-2 tw:font-bold"
          >{{ $t('event.page.details.reg_programme') }}:
        </strong>
        <Separator
          class="tw:bg-white/12 tw:data-[orientation=horizontal]:h-0.5"
        />
        <ul class="tw:mt-2 tw:ml-6 tw:list-disc">
          <li
            v-for="programme in requirements.programmes"
            :key="programme"
            class="tw:px-2 tw:py-1"
          >
            {{ programme }}
          </li>
        </ul>
      </div>
    </Card>

    <Button
      v-if="state.kind === 'sign-in'"
      as-child
      variant="ghost"
      class="tw:h-[52px] tw:rounded-lg tw:px-4 tw:text-base tw:tracking-[0.0892857em] tw:text-brand tw:hover:bg-brand/5 tw:hover:text-brand"
    >
      <NuxtLink :to="localePath('/user/signin')">
        <LogIn class="tw:size-5" />
        {{ $t('program.event.sign_in_to_register') }}
      </NuxtLink>
    </Button>

    <EventTicket
      v-if="ticketUid && state.kind === 'registered'"
      :uid="ticketUid"
    />

    <Button
      v-if="mayScan"
      as-child
      variant="secondary"
      class="tw:h-[52px] tw:rounded-[4px] tw:bg-black/10 tw:px-6 tw:text-lg tw:tracking-[0.0892857em] tw:text-black/87 tw:hover:bg-black/15"
    >
      <NuxtLink :to="localePath(`/event/${eventUid}/scan`)">
        {{ $t('event.page.attendants.scan') }}
        <Camera class="tw:size-5" />
      </NuxtLink>
    </Button>

    <div
      v-if="closed"
      class="tw:flex tw:flex-col tw:items-center tw:justify-center tw:px-4 tw:py-2 tw:text-brand"
    >
      <span class="tw:flex tw:items-center">
        <CalendarClock class="tw:mr-3 tw:size-6" />
        {{ $t('program.event.registration_closed') }}
      </span>
      <span v-if="countdown">{{ countdown }}</span>
    </div>

    <Button
      v-if="state.kind === 'open' || state.kind === 'not-eligible'"
      :class="signUpClass"
      :disabled="busy || state.kind === 'not-eligible'"
      @click.stop="send('POST', 'alert.success.event.register.sign_up')"
    >
      <LoaderCircle v-if="busy" class="tw:size-6 tw:animate-spin" />
      <template v-else>{{ $t('program.event.sign_up') }}</template>
    </Button>

    <Button
      v-else-if="state.kind === 'full'"
      :class="signUpClass"
      :disabled="busy"
      @click.stop="send('POST', 'alert.success.event.register.queue')"
    >
      <LoaderCircle v-if="busy" class="tw:size-6 tw:animate-spin" />
      <template v-else>{{ $t('program.event.enqueue') }}</template>
    </Button>

    <p
      v-if="state.kind === 'not-eligible'"
      class="tw:text-center tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178571em]"
    >
      {{ $t('events.page.not_eligible') }}
    </p>

    <Dialog
      v-if="state.kind === 'registered' || state.kind === 'queued'"
      v-model:open="confirming"
    >
      <DialogTrigger as-child>
        <Button
          class="tw:h-11 tw:w-full tw:rounded-[4px] tw:bg-brand/12 tw:px-6 tw:text-lg tw:tracking-[0.0892857em] tw:text-brand tw:hover:bg-brand/20"
        >
          {{
            $t(
              state.kind === 'registered'
                ? 'program.event.opt_out.name'
                : 'program.event.opt_out.queue',
            )
          }}
        </Button>
      </DialogTrigger>
      <DialogContent
        :show-close-button="false"
        :aria-describedby="undefined"
        class="tw:gap-0 tw:rounded-lg tw:border-0 tw:p-6 tw:text-center tw:sm:max-w-[500px]"
      >
        <DialogTitle class="tw:text-xl tw:leading-normal tw:font-normal">
          {{ $t('program.event.opt_out.confirmtext') }}
        </DialogTitle>
        <div class="tw:mt-6 tw:flex tw:flex-wrap tw:justify-center tw:gap-6">
          <Button
            variant="outline"
            class="tw:h-11 tw:rounded-[4px] tw:border-brand tw:bg-transparent tw:px-5 tw:text-base tw:tracking-[0.0892857em] tw:text-brand tw:shadow-none tw:hover:bg-brand/5 tw:hover:text-brand"
            :disabled="busy"
            @click="
              send(
                'DELETE',
                state.kind === 'registered'
                  ? 'alert.success.event.register.opt_out'
                  : 'alert.success.event.register.opt_out_queue',
              )
            "
          >
            <LoaderCircle v-if="busy" class="tw:size-5 tw:animate-spin" />
            <template v-else>{{
              $t('program.event.opt_out.confirm')
            }}</template>
          </Button>
          <Button
            class="tw:h-11 tw:rounded-[4px] tw:bg-[#2BA84A] tw:px-5 tw:text-base tw:tracking-[0.0892857em] tw:text-white tw:hover:bg-[#2BA84A]/90"
            @click="confirming = false"
          >
            {{ $t('program.event.opt_out.abort') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Button
      v-if="calendar && state.kind !== 'past'"
      variant="ghost"
      class="tw:h-[52px] tw:rounded-lg tw:px-6 tw:text-lg tw:tracking-[0.0892857em] tw:text-brand tw:hover:bg-brand/5 tw:hover:text-brand"
      @click="downloadCalendar"
    >
      <CalendarPlus class="tw:size-5" />
      {{ $t('events.page.action.calendar') }}
    </Button>
  </div>
</template>
