<script setup lang="ts">
  import { ImageUp, MapPinned, Trash2 } from '@lucide/vue'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { alertError, notify } from '@/composables/useAlerts'
  import { FairDay } from '@/domain/fair/day'
  import { Instant } from '@/domain/time'
  import { standMapDays, type ListedStandMap } from '@/lib/admin/standMaps'
  import { formatDay, osloDay } from '@/lib/time'

  const { t, locale } = useI18n()

  const [{ data: events }, { data: maps, refresh }] = await Promise.all([
    useFetch<Record<string, { date?: { start?: string } }>>('/api/v1/event'),
    useFetch<ListedStandMap[]>('/api/v1/image/standmap'),
  ])

  const today = osloDay(Instant.now())
  const days = computed(() => standMapDays(events.value, maps.value, today))

  const label = (day: string) =>
    formatDay(day, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

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
      notify(t('admin.standmaps.done.uploaded', { day: label(day) }), 'success')
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
      notify(t('admin.standmaps.done.removed', { day: label(day) }), 'success')
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
  <div class="flex max-w-4xl flex-col gap-6">
    <p class="text-muted-foreground">{{ $t('admin.standmaps.intro') }}</p>

    <input
      ref="picker"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      @change="upload"
    />

    <ul
      v-if="days.length"
      class="divide-y overflow-hidden rounded-lg border bg-card"
    >
      <li
        v-for="row in days"
        :key="row.day"
        class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
      >
        <a
          v-if="row.map"
          :href="row.map.url"
          target="_blank"
          rel="noopener"
          class="block h-20 w-32 shrink-0 overflow-hidden rounded-md border bg-muted"
          :aria-label="$t('admin.standmaps.open', { day: label(row.day) })"
        >
          <img :src="row.map.url" alt="" class="size-full object-cover" />
        </a>
        <div
          v-else
          class="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground"
        >
          <MapPinned class="size-6" stroke-width="1.5" aria-hidden="true" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="font-bold first-letter:uppercase">
            {{ label(row.day) }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ $t('admin.standmaps.events', row.events) }}
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <template v-if="row.map">
              <span class="truncate">{{ row.map.name }}</span>
            </template>
            <span v-else class="text-muted-foreground">{{
              $t('admin.standmaps.none')
            }}</span>
          </div>
        </div>

        <div class="flex gap-2">
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
            v-if="row.map"
            variant="ghost"
            class="text-destructive hover:bg-destructive/10 hover:text-destructive"
            :disabled="busy !== null"
            :aria-label="$t('admin.standmaps.remove', { day: label(row.day) })"
            @click="removing = { day: row.day, name: row.map.name }"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </li>
    </ul>
    <p v-else class="rounded-lg border bg-card p-6 text-muted-foreground">
      {{ $t('admin.standmaps.empty') }}
    </p>

    <form
      class="flex flex-col gap-2 sm:flex-row sm:items-end"
      @submit.prevent="chooseOther"
    >
      <div class="flex flex-col gap-1.5">
        <Label for="other-day">{{ $t('admin.standmaps.other') }}</Label>
        <Input
          id="other-day"
          v-model="otherDay"
          type="date"
          :min="today"
          class="w-48"
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
    <p class="text-sm text-muted-foreground">
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
