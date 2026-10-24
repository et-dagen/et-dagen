<script setup lang="ts">
  import { ArrowLeft, Plus, ScanLine, Trash2, UserPlus } from '@lucide/vue'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import EventTabs from '@/components/admin/EventTabs.vue'
  import SearchField from '@/components/admin/SearchField.vue'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Input } from '@/components/ui/input'
  import {
    candidates,
    rosterOf,
    type Attendee,
    type Person,
    type StoredAttendant,
  } from '@/lib/admin/attendees'
  import { search } from '@/lib/admin/listView'

  interface StoredEvent {
    title?: string
    capacity?: number | null
    attendants?: Record<string, StoredAttendant> | null
    queue?: Record<string, string> | null
  }

  const { t } = useI18n()
  const localePath = useLocalePath()
  const alerts = useAlertStore()
  const uid = String(useRoute().params.id)

  const { data: events, refresh } = await useFetch<Record<string, StoredEvent>>(
    '/api/v1/event',
    { query: { eventUID: uid } },
  )
  const event = computed(() => events.value?.[uid])
  const { data: users } = await useFetch<Person[]>('/api/v1/user', {
    query: { scope: 'all' },
  })
  const people = computed(
    () => new Map((users.value ?? []).map((person) => [person.uid, person])),
  )
  const roster = computed(() => rosterOf(event.value ?? {}, people.value))
  const attended = computed(
    () => roster.value.attendees.filter((attendee) => attendee.attended).length,
  )

  const filter = ref('')
  const shown = computed(() =>
    search(roster.value.attendees, filter.value, (attendee) => [
      attendee.name,
      attendee.email,
      attendee.programme,
    ]),
  )

  const lookup = ref('')
  const matches = computed(() =>
    candidates(users.value ?? [], roster.value, lookup.value),
  )

  /** Shows the message for an error from v1, or a general one */
  function failed(error: unknown) {
    const message = (error as { statusMessage?: string }).statusMessage
    alerts.alert(message ?? t('admin.attendees.failed'), 'error')
  }

  const busy = ref<string | null>(null)
  async function add(person: Person) {
    busy.value = person.uid
    const full = roster.value.attendees.length >= (event.value?.capacity ?? 0)
    try {
      await $fetch('/api/v1/event/register', {
        method: 'POST',
        body: { eventUID: uid, userUID: person.uid },
      })
      lookup.value = ''
      await refresh()
      const name = person.name || person.email || person.uid
      alerts.alert(
        t(full ? 'admin.attendees.queued' : 'admin.attendees.added', { name }),
        'success',
      )
    } catch (error) {
      failed(error)
    } finally {
      busy.value = null
    }
  }

  // ticks shown before the server has confirmed them
  const ticking = ref<Record<string, boolean>>({})
  const isAttended = (attendee: Attendee) =>
    ticking.value[attendee.uid] ?? attendee.attended

  async function setAttended(attendee: Attendee, value: boolean) {
    ticking.value = { ...ticking.value, [attendee.uid]: value }
    try {
      await $fetch('/api/v1/event/attended', {
        method: 'PATCH',
        body: { eventUID: uid, userUID: attendee.uid, attended: value },
      })
    } catch (error) {
      failed(error)
    }
    await refresh()
    ticking.value = Object.fromEntries(
      Object.entries(ticking.value).filter(([uid]) => uid !== attendee.uid),
    )
  }

  const removing = ref<Attendee | null>(null)
  const confirming = computed({
    get: () => removing.value !== null,
    set: (open) => {
      if (!open) removing.value = null
    },
  })
  async function remove() {
    const attendee = removing.value
    if (!attendee) return
    busy.value = attendee.uid
    try {
      await $fetch('/api/v1/event/register', {
        method: 'DELETE',
        body: { eventUID: uid, userUID: attendee.uid },
      })
      removing.value = null
      await refresh()
      alerts.alert(
        t('admin.attendees.removed', { name: attendee.name }),
        'success',
      )
    } catch (error) {
      failed(error)
    } finally {
      busy.value = null
    }
  }
  const removeDescription = computed(() => {
    const attendee = removing.value
    if (!attendee) return ''
    const waiting = roster.value.queue.length > 0
    const holdsPlace = roster.value.attendees.some(
      (other) => other.uid === attendee.uid,
    )
    return t(
      holdsPlace && waiting
        ? 'admin.attendees.remove_moves_up'
        : 'admin.attendees.remove_description',
    )
  })

  const detailsOf = (attendee: Attendee) =>
    [
      attendee.email,
      attendee.programme,
      attendee.year ? t('company.admin.year', { n: attendee.year }) : null,
    ].filter(Boolean)
</script>

<template>
  <div v-if="event" class="tw:flex tw:max-w-4xl tw:flex-col tw:gap-6">
    <NuxtLink
      :to="localePath('/admin/events')"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t('admin.events.name') }}
    </NuxtLink>
    <h1
      class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ event.title }}
    </h1>
    <EventTabs :uid="uid" />

    <p v-if="!event.capacity" class="tw:text-muted-foreground">
      {{ $t('admin.attendees.no_signup') }}
    </p>

    <template v-else>
      <div
        class="tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between"
      >
        <dl class="tw:flex tw:gap-6">
          <div>
            <dt class="tw:text-sm tw:text-muted-foreground">
              {{ $t('admin.attendees.places') }}
            </dt>
            <dd class="tw:text-xl tw:font-bold tw:tabular-nums">
              {{ roster.attendees.length }}
              <span class="tw:font-normal tw:text-muted-foreground">
                / {{ event.capacity }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="tw:text-sm tw:text-muted-foreground">
              {{ $t('admin.attendees.attended') }}
            </dt>
            <dd class="tw:text-xl tw:font-bold tw:tabular-nums">
              {{ attended }}
            </dd>
          </div>
          <div>
            <dt class="tw:text-sm tw:text-muted-foreground">
              {{ $t('admin.attendees.waiting') }}
            </dt>
            <dd class="tw:text-xl tw:font-bold tw:tabular-nums">
              {{ roster.queue.length }}
            </dd>
          </div>
        </dl>
        <Button as-child variant="outline">
          <NuxtLink :to="localePath(`/event/${uid}/scan_attendants`)">
            <ScanLine aria-hidden="true" />
            {{ $t('admin.attendees.scan') }}
          </NuxtLink>
        </Button>
      </div>

      <section
        class="tw:flex tw:flex-col tw:gap-3 tw:rounded-lg tw:border tw:bg-card tw:p-4"
        aria-labelledby="add-heading"
      >
        <h2
          id="add-heading"
          class="tw:flex tw:items-center tw:gap-2 tw:font-bold"
        >
          <UserPlus class="tw:size-4" aria-hidden="true" />
          {{ $t('admin.attendees.add') }}
        </h2>
        <Input
          v-model="lookup"
          type="search"
          :placeholder="$t('admin.attendees.add_search')"
          :aria-label="$t('admin.attendees.add_search')"
        />
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('admin.attendees.add_hint') }}
        </p>
        <ul
          v-if="lookup.trim()"
          class="tw:divide-y tw:overflow-hidden tw:rounded-md tw:border"
        >
          <li v-for="person in matches" :key="person.uid">
            <button
              type="button"
              class="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-3 tw:py-2 tw:text-left tw:hover:bg-accent tw:disabled:opacity-50"
              :disabled="busy !== null"
              @click="add(person)"
            >
              <Plus
                class="tw:size-4 tw:shrink-0 tw:text-muted-foreground"
                aria-hidden="true"
              />
              <span class="tw:min-w-0">
                <span class="tw:block tw:truncate tw:font-semibold">
                  {{ person.name || person.email }}
                </span>
                <span
                  class="tw:block tw:truncate tw:text-sm tw:text-muted-foreground"
                >
                  {{ person.email }}
                </span>
              </span>
            </button>
          </li>
          <li
            v-if="!matches.length"
            class="tw:px-3 tw:py-2 tw:text-sm tw:text-muted-foreground"
          >
            {{ $t('form.picker.none') }}
          </li>
        </ul>
      </section>

      <section
        class="tw:flex tw:flex-col tw:gap-3"
        aria-labelledby="list-heading"
      >
        <div
          class="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between"
        >
          <h2 id="list-heading" class="tw:text-lg tw:font-bold">
            {{ $t('admin.attendees.list') }}
          </h2>
          <SearchField v-model="filter" :label="$t('admin.attendees.filter')" />
        </div>
        <ul
          class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
        >
          <li
            v-for="attendee in shown"
            :key="attendee.uid"
            :data-attended="isAttended(attendee) || undefined"
            class="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:data-attended:bg-plate/5"
          >
            <Checkbox
              :model-value="isAttended(attendee)"
              :aria-label="
                $t('admin.attendees.mark_attended', { name: attendee.name })
              "
              class="tw:size-5"
              @update:model-value="(on) => setAttended(attendee, on === true)"
            />
            <div class="tw:min-w-0 tw:flex-1">
              <p class="tw:truncate tw:font-semibold">{{ attendee.name }}</p>
              <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
                {{ detailsOf(attendee).join(' · ') }}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="
                $t('admin.attendees.remove', { name: attendee.name })
              "
              @click="removing = attendee"
            >
              <Trash2 class="tw:text-destructive" aria-hidden="true" />
            </Button>
          </li>
          <li
            v-if="!shown.length"
            class="tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
          >
            {{
              $t(
                roster.attendees.length
                  ? 'admin.attendees.no_match'
                  : 'admin.attendees.empty',
              )
            }}
          </li>
        </ul>
      </section>

      <section
        v-if="roster.queue.length"
        class="tw:flex tw:flex-col tw:gap-3"
        aria-labelledby="queue-heading"
      >
        <h2 id="queue-heading" class="tw:text-lg tw:font-bold">
          {{ $t('admin.attendees.queue') }}
        </h2>
        <ol
          class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
        >
          <li
            v-for="(attendee, position) in roster.queue"
            :key="attendee.uid"
            class="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3"
          >
            <span
              class="tw:grid tw:size-6 tw:shrink-0 tw:place-items-center tw:rounded-sm tw:bg-muted tw:pt-0.5 tw:text-sm tw:font-bold tw:tabular-nums"
            >
              {{ position + 1 }}
            </span>
            <div class="tw:min-w-0 tw:flex-1">
              <p class="tw:truncate tw:font-semibold">{{ attendee.name }}</p>
              <p class="tw:truncate tw:text-sm tw:text-muted-foreground">
                {{ detailsOf(attendee).join(' · ') }}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="
                $t('admin.attendees.remove', { name: attendee.name })
              "
              @click="removing = attendee"
            >
              <Trash2 class="tw:text-destructive" aria-hidden="true" />
            </Button>
          </li>
        </ol>
      </section>
    </template>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.attendees.remove_title')"
      :description="removeDescription"
      :confirm="$t('admin.attendees.remove_confirm')"
      :items="
        removing
          ? [
              {
                key: removing.uid,
                label: removing.name,
                detail: removing.email ?? undefined,
              },
            ]
          : []
      "
      :loading="busy !== null"
      @confirm="remove"
    />
  </div>
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.events.form.missing') }}
  </p>
</template>
