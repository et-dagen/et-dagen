<script setup lang="ts">
  import { ArrowLeft, Plus, ScanLine, Trash2, UserPlus } from '@lucide/vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { useProgrammes } from '@/composables/useProgrammes'
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
  const uid = String(useRoute().params.id)

  const { data: events, refresh } = await useFetch<Record<string, StoredEvent>>(
    '/api/v1/event',
    { query: { eventUID: uid } },
  )
  const event = computed(() => events.value?.[uid])
  const { data: users } = await useFetch<Person[]>('/api/v1/user', {
    query: { scope: 'all' },
  })
  const { nameOf } = await useProgrammes()
  // people show their programme's name, whether they stored its code or, before codes, its name
  const people = computed(
    () =>
      new Map(
        (users.value ?? []).map((person) => [
          person.uid,
          { ...person, studyProgram: nameOf(person.studyProgram) || null },
        ]),
      ),
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
      notify(
        t(full ? 'admin.attendees.queued' : 'admin.attendees.added', { name }),
        'success',
      )
    } catch (error) {
      alertError(error)
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
      alertError(error)
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
      notify(t('admin.attendees.removed', { name: attendee.name }), 'success')
    } catch (error) {
      alertError(error)
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
  <div v-if="event" class="flex max-w-4xl flex-col gap-6">
    <NuxtLink
      :to="localePath('/admin/events')"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t('admin.events.name') }}
    </NuxtLink>
    <h1
      class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
    >
      {{ event.title }}
    </h1>
    <EventTabs :uid="uid" />

    <p v-if="!event.capacity" class="text-muted-foreground">
      {{ $t('admin.attendees.no_signup') }}
    </p>

    <template v-else>
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <dl class="flex gap-6">
          <div>
            <dt class="text-sm text-muted-foreground">
              {{ $t('admin.attendees.places') }}
            </dt>
            <dd class="text-xl font-bold tabular-nums">
              {{ roster.attendees.length }}
              <span class="font-normal text-muted-foreground">
                / {{ event.capacity }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted-foreground">
              {{ $t('admin.attendees.attended') }}
            </dt>
            <dd class="text-xl font-bold tabular-nums">
              {{ attended }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted-foreground">
              {{ $t('admin.attendees.waiting') }}
            </dt>
            <dd class="text-xl font-bold tabular-nums">
              {{ roster.queue.length }}
            </dd>
          </div>
        </dl>
        <Button as-child variant="outline">
          <NuxtLink :to="localePath(`/event/${uid}/scan`)">
            <ScanLine aria-hidden="true" />
            {{ $t('admin.attendees.scan') }}
          </NuxtLink>
        </Button>
      </div>

      <section
        class="flex flex-col gap-3 rounded-lg border bg-card p-4"
        aria-labelledby="add-heading"
      >
        <h2 id="add-heading" class="flex items-center gap-2 font-bold">
          <UserPlus class="size-4" aria-hidden="true" />
          {{ $t('admin.attendees.add') }}
        </h2>
        <Input
          v-model="lookup"
          type="search"
          :placeholder="$t('admin.attendees.add_search')"
          :aria-label="$t('admin.attendees.add_search')"
        />
        <p class="text-sm text-muted-foreground">
          {{ $t('admin.attendees.add_hint') }}
        </p>
        <ul
          v-if="lookup.trim()"
          class="divide-y overflow-hidden rounded-md border"
        >
          <li v-for="person in matches" :key="person.uid">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent disabled:opacity-50"
              :disabled="busy !== null"
              @click="add(person)"
            >
              <Plus
                class="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span class="min-w-0">
                <span class="block truncate font-semibold">
                  {{ person.name || person.email }}
                </span>
                <span class="block truncate text-sm text-muted-foreground">
                  {{ person.email }}
                </span>
              </span>
            </button>
          </li>
          <li
            v-if="!matches.length"
            class="px-3 py-2 text-sm text-muted-foreground"
          >
            {{ $t('form.picker.none') }}
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-3" aria-labelledby="list-heading">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <h2 id="list-heading" class="text-lg font-bold">
            {{ $t('admin.attendees.list') }}
          </h2>
          <SearchField v-model="filter" :label="$t('admin.attendees.filter')" />
        </div>
        <ul class="divide-y overflow-hidden rounded-lg border bg-card">
          <li
            v-for="attendee in shown"
            :key="attendee.uid"
            :data-attended="isAttended(attendee) || undefined"
            class="flex items-center gap-3 px-4 py-3 data-attended:bg-plate/5"
          >
            <Checkbox
              :model-value="isAttended(attendee)"
              :aria-label="
                $t('admin.attendees.mark_attended', { name: attendee.name })
              "
              class="size-5"
              @update:model-value="(on) => setAttended(attendee, on === true)"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ attendee.name }}</p>
              <p class="truncate text-sm text-muted-foreground">
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
              <Trash2 class="text-destructive" aria-hidden="true" />
            </Button>
          </li>
          <li
            v-if="!shown.length"
            class="px-4 py-10 text-center text-muted-foreground"
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
        class="flex flex-col gap-3"
        aria-labelledby="queue-heading"
      >
        <h2 id="queue-heading" class="text-lg font-bold">
          {{ $t('admin.attendees.queue') }}
        </h2>
        <ol class="divide-y overflow-hidden rounded-lg border bg-card">
          <li
            v-for="(attendee, position) in roster.queue"
            :key="attendee.uid"
            class="flex items-center gap-3 px-4 py-3"
          >
            <span
              class="grid size-6 shrink-0 place-items-center rounded-sm bg-muted pt-0.5 text-sm font-bold tabular-nums"
            >
              {{ position + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ attendee.name }}</p>
              <p class="truncate text-sm text-muted-foreground">
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
              <Trash2 class="text-destructive" aria-hidden="true" />
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
  <p v-else class="text-muted-foreground">
    {{ $t('admin.events.form.missing') }}
  </p>
</template>
