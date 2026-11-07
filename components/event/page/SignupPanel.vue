<script setup lang="ts">
  import EventTicket from '@/components/event/page/EventTicket.vue'
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
  <div class="attendant-container">
    <VCard class="attendants elevation-4" color="primary" rounded="lg">
      <VCardTitle class="attendants__title">
        {{ $t('event.page.attendants.name') }}
      </VCardTitle>

      <VCardText
        v-if="places.limit"
        class="attendants__count d-flex justify-space-between flex-wrap"
      >
        <span>
          <strong>{{ $t('event.page.attendants.attendants') }}: </strong>
          {{ places.taken }} / {{ places.limit }}

          <strong style="margin-left: 10px">
            {{ $t('event.page.queue.name') }}:
          </strong>
          {{ places.waiting }}
        </span>

        <span v-if="state.kind === 'registered'">
          {{ $t('event.page.attendants.registered') }}
          <VIcon style="margin-bottom: 2px">mdi-check-circle</VIcon>
        </span>

        <div v-if="state.kind === 'queued'">
          {{ $t('event.page.queue.position') }}:
          {{ state.position }}
        </div>
      </VCardText>

      <VCardText v-else>
        {{ $t('event.page.attendants.nocapacity') }}
      </VCardText>

      <VCardText
        v-if="requirements.years.length"
        class="reg__year py-0 pb-5 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_year') }}: </strong>
        <span
          v-for="year in requirements.years"
          :key="year"
          class="comma-separated"
          >{{ year }}</span
        >
      </VCardText>

      <VCardText
        v-if="requirements.programmes.length"
        class="reg__programme py-0 pb-5 d-flex flex-wrap flex-column"
      >
        <strong class="mr-2"
          >{{ $t('event.page.details.reg_programme') }}:
        </strong>
        <VDivider />
        <ul class="ml-6 mt-2">
          <li
            v-for="programme in requirements.programmes"
            :key="programme"
            class="py-1 px-2"
          >
            {{ programme }}
          </li>
        </ul>
      </VCardText>
    </VCard>

    <VBtn
      v-if="state.kind === 'sign-in'"
      rounded="lg"
      variant="text"
      class="text-primary px-4 py-2 d-flex justify-center align-center login"
      prepend-icon="mdi-login"
      :to="localePath('/user/signin')"
    >
      {{ $t('program.event.sign_in_to_register') }}
    </VBtn>

    <EventTicket
      v-if="ticketUid && state.kind === 'registered'"
      :uid="ticketUid"
    />

    <VBtn
      v-if="mayScan"
      variant="tonal"
      append-icon="mdi-camera"
      :to="localePath(`/event/${eventUid}/scan`)"
    >
      {{ $t('event.page.attendants.scan') }}
    </VBtn>

    <div
      v-if="closed"
      class="text-primary px-4 py-2 d-flex flex-column justify-center align-center"
    >
      <span class="d-flex align-center">
        <VIcon class="pr-3">mdi-calendar-clock</VIcon>
        {{ $t('program.event.registration_closed') }}
      </span>
      <span v-if="countdown">{{ countdown }}</span>
    </div>

    <VBtn
      v-if="state.kind === 'open' || state.kind === 'not-eligible'"
      color="success"
      :loading="busy"
      block
      variant="flat"
      density="comfortable"
      :disabled="state.kind === 'not-eligible'"
      @click.stop="send('POST', 'alert.success.event.register.sign_up')"
    >
      {{ $t('program.event.sign_up') }}
    </VBtn>

    <VBtn
      v-else-if="state.kind === 'full'"
      color="success"
      :loading="busy"
      block
      variant="flat"
      density="comfortable"
      @click.stop="send('POST', 'alert.success.event.register.queue')"
    >
      {{ $t('program.event.enqueue') }}
    </VBtn>

    <p v-if="state.kind === 'not-eligible'" class="text-body-2 text-center">
      {{ $t('events.page.not_eligible') }}
    </p>

    <VDialog
      v-if="state.kind === 'registered' || state.kind === 'queued'"
      v-model="confirming"
      width="500"
    >
      <template #activator="{ props: activator }">
        <VBtn
          v-bind="activator"
          color="primary"
          block
          variant="tonal"
          density="comfortable"
        >
          {{
            $t(
              state.kind === 'registered'
                ? 'program.event.opt_out.name'
                : 'program.event.opt_out.queue',
            )
          }}
        </VBtn>
      </template>
      <VCard rounded="lg" class="text-center pa-6">
        <h6>{{ $t('program.event.opt_out.confirmtext') }}</h6>
        <div class="d-flex justify-center flex-wrap mt-6" style="gap: 1.5rem">
          <VBtn
            size="large"
            variant="outlined"
            color="primary"
            :loading="busy"
            @click="
              send(
                'DELETE',
                state.kind === 'registered'
                  ? 'alert.success.event.register.opt_out'
                  : 'alert.success.event.register.opt_out_queue',
              )
            "
          >
            {{ $t('program.event.opt_out.confirm') }}
          </VBtn>
          <VBtn size="large" flat color="success" @click="confirming = false">
            {{ $t('program.event.opt_out.abort') }}
          </VBtn>
        </div>
      </VCard>
    </VDialog>

    <VBtn
      v-if="calendar && state.kind !== 'past'"
      rounded="lg"
      variant="text"
      class="text-primary"
      prepend-icon="mdi-calendar-plus"
      @click="downloadCalendar"
    >
      {{ $t('events.page.action.calendar') }}
    </VBtn>
  </div>
</template>

<style scoped lang="scss">
  .attendant-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .login {
    font-size: 1rem;
  }

  .comma-separated {
    &::after {
      content: ',\00a0';
    }
    &:last-child::after {
      content: '';
    }
  }
</style>
