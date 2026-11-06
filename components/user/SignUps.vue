<script setup lang="ts">
  import { alertError, notify } from '@/composables/useAlerts'
  import { placeOf } from '@/lib/events'
  import { formatWhen } from '@/lib/time'
  import type { SignUpRow } from '@/lib/user/signUps'
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog'
  import { Button } from '@/components/ui/button'

  defineProps<{ rows: SignUpRow[] }>()
  const emit = defineEmits<{ withdrawn: [] }>()

  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  const when = (row: SignUpRow) =>
    formatWhen(row.event.date?.start, locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const busy = ref<string | null>(null)
  const withdraw = async (row: SignUpRow) => {
    busy.value = row.eventUID
    try {
      await $fetch('/api/v1/event/register', {
        method: 'DELETE',
        body: { eventUID: row.eventUID },
      })
      notify(
        t('user.page.withdrawn', { title: row.event.title ?? '' }),
        'success',
      )
      emit('withdrawn')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = null
    }
  }
</script>

<template>
  <ul>
    <li
      v-for="row in rows"
      :key="row.eventUID"
      class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-t px-5 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:gap-x-6 sm:px-6"
    >
      <div class="col-span-2 min-w-0 sm:col-span-1">
        <NuxtLink
          :to="localePath(`/event/${row.eventUID}`)"
          class="font-bold hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4"
        >
          {{ row.event.title }}
        </NuxtLink>
        <p
          class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <span class="first-letter:uppercase">{{ when(row) }}</span>
          <span
            v-if="placeOf(row.event.location?.name).code"
            class="rounded bg-plate px-1.5 pt-0.5 text-xs font-extrabold text-plate-foreground"
          >
            {{ placeOf(row.event.location?.name).code }}
          </span>
        </p>
      </div>

      <span
        v-if="row.status === 'attending'"
        class="inline-flex items-center gap-2 justify-self-start rounded-full bg-muted px-3 pt-1 pb-0.5 text-sm font-bold text-plate"
      >
        <span class="size-2 rounded-full bg-plate" aria-hidden="true" />
        {{ $t('user.page.attending') }}
      </span>
      <span
        v-else
        class="justify-self-start rounded-full bg-signal px-3 pt-1 pb-0.5 text-sm font-bold text-signal-foreground"
      >
        {{ $t('user.page.queued', { n: row.position }) }}
      </span>

      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="outline" :disabled="busy === row.eventUID">
            {{ $t('user.page.withdraw') }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent class="rounded-md bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle class="text-lg font-bold">
              {{ $t('user.page.withdraw_title', { title: row.event.title }) }}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {{
                row.status === 'attending'
                  ? $t('user.page.withdraw_place')
                  : $t('user.page.withdraw_queue')
              }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ $t('user.page.keep') }}</AlertDialogCancel>
            <AlertDialogAction @click="withdraw(row)">
              {{ $t('user.page.withdraw') }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  </ul>
</template>
