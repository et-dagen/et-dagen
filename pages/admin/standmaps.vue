<script setup lang="ts">
  import { ImageUp, MapPinned, Trash2 } from '@lucide/vue'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { alertError } from '@/composables/useAlerts'
  import { FairDay } from '@/domain/fair/day'
  import { standMapDays, type ListedStandMap } from '@/lib/admin/standMaps'

  const { t, locale } = useI18n()
  const alerts = useAlertStore()

  const [{ data: events }, { data: maps, refresh }] = await Promise.all([
    useFetch<Record<string, { date?: { start?: string } }>>('/api/v1/event'),
    useFetch<ListedStandMap[]>('/api/v1/image/standmap'),
  ])

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
  }).format(new Date())
  const days = computed(() => standMapDays(events.value, maps.value, today))

  const label = (day: string) =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${day}T12:00:00Z`))

  // one hidden file input serves every row; `target` is the day it uploads for
  const picker = ref<HTMLInputElement | null>(null)
  const target = ref<FairDay | null>(null)
  const busy = ref<string | null>(null)

  function choose(day: FairDay) {
    target.value = day
    picker.value?.click()
  }

  async function upload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    const day = target.value
    input.value = ''
    if (!file || !day) return
    busy.value = day
    try {
      const body = new FormData()
      body.append('file', file)
      await $fetch(`/api/v1/image/standmap/${day}`, { method: 'PUT', body })
      alerts.alert(
        t('admin.standmaps.done.uploaded', { day: label(day) }),
        'success',
      )
      await refresh()
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = null
    }
  }

  // a day without events, for a map that goes up before the programme does
  const otherDay = ref('')
  function chooseOther() {
    const day = FairDay.tryParse(otherDay.value)
    if (day) choose(day)
  }

  const removing = ref<{ day: FairDay; name: string } | null>(null)
  const confirming = computed({
    get: () => removing.value !== null,
    set: (open) => {
      if (!open) removing.value = null
    },
  })
  async function remove() {
    const day = removing.value?.day
    if (!day) return
    busy.value = day
    try {
      await $fetch(`/api/v1/image/standmap/${day}`, { method: 'DELETE' })
      alerts.alert(
        t('admin.standmaps.done.removed', { day: label(day) }),
        'success',
      )
      removing.value = null
      await refresh()
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = null
    }
  }
</script>

<template>
  <div class="tw:flex tw:max-w-4xl tw:flex-col tw:gap-6">
    <p class="tw:text-muted-foreground">{{ $t('admin.standmaps.intro') }}</p>

    <input
      ref="picker"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="tw:hidden"
      @change="upload"
    />

    <ul
      v-if="days.length"
      class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
    >
      <li
        v-for="row in days"
        :key="row.day"
        class="tw:flex tw:flex-col tw:gap-4 tw:p-4 tw:sm:flex-row tw:sm:items-center"
      >
        <a
          v-if="row.map"
          :href="row.map.url"
          target="_blank"
          rel="noopener"
          class="tw:block tw:h-20 tw:w-32 tw:shrink-0 tw:overflow-hidden tw:rounded-md tw:border tw:bg-muted"
          :aria-label="$t('admin.standmaps.open', { day: label(row.day) })"
        >
          <img :src="row.map.url" alt="" class="tw:size-full tw:object-cover" />
        </a>
        <div
          v-else
          class="tw:flex tw:h-20 tw:w-32 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-dashed tw:text-muted-foreground"
        >
          <MapPinned class="tw:size-6" stroke-width="1.5" aria-hidden="true" />
        </div>

        <div class="tw:min-w-0 tw:flex-1">
          <p class="tw:font-bold tw:first-letter:uppercase">
            {{ label(row.day) }}
          </p>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.standmaps.events', row.events) }}
          </p>
          <div
            class="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-sm"
          >
            <template v-if="row.map">
              <span class="tw:truncate">{{
                row.map.name ?? $t('admin.standmaps.unnamed')
              }}</span>
              <Badge v-if="row.map.legacy" variant="secondary">
                {{ $t('admin.standmaps.legacy') }}
              </Badge>
            </template>
            <span v-else class="tw:text-muted-foreground">{{
              $t('admin.standmaps.none')
            }}</span>
          </div>
        </div>

        <div class="tw:flex tw:gap-2">
          <Button
            variant="outline"
            :disabled="busy !== null"
            @click="choose(row.day)"
          >
            <ImageUp aria-hidden="true" />
            {{
              $t(row.map ? 'admin.standmaps.replace' : 'admin.standmaps.upload')
            }}
          </Button>
          <Button
            v-if="row.map && !row.map.legacy"
            variant="ghost"
            class="tw:text-destructive tw:hover:bg-destructive/10 tw:hover:text-destructive"
            :disabled="busy !== null"
            :aria-label="$t('admin.standmaps.remove', { day: label(row.day) })"
            @click="removing = { day: row.day, name: row.map.name ?? '' }"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </li>
    </ul>
    <p
      v-else
      class="tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:text-muted-foreground"
    >
      {{ $t('admin.standmaps.empty') }}
    </p>

    <form
      class="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-end"
      @submit.prevent="chooseOther"
    >
      <div class="tw:flex tw:flex-col tw:gap-1.5">
        <Label for="other-day">{{ $t('admin.standmaps.other') }}</Label>
        <Input
          id="other-day"
          v-model="otherDay"
          type="date"
          :min="today"
          class="tw:w-48"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        :disabled="!otherDay || busy !== null"
      >
        <ImageUp aria-hidden="true" />
        {{ $t('admin.standmaps.upload') }}
      </Button>
    </form>
    <p class="tw:text-sm tw:text-muted-foreground">
      {{ $t('admin.standmaps.formats') }}
    </p>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.standmaps.confirm.title')"
      :description="$t('admin.standmaps.confirm.text')"
      :confirm="$t('admin.standmaps.confirm.action')"
      :items="
        removing
          ? [
              {
                key: removing.day,
                label: label(removing.day),
                detail: removing.name,
              },
            ]
          : []
      "
      :loading="busy !== null"
      @confirm="remove"
    />
  </div>
</template>
