<script setup lang="ts">
  import { placeOf } from '@/lib/admin/events'
  import { formatWhen } from '@/lib/admin/time'
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
      useAlertStore().alert(
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
      class="tw:grid tw:grid-cols-[minmax(0,1fr)_auto] tw:items-center tw:gap-x-4 tw:gap-y-3 tw:border-t tw:px-5 tw:py-4 tw:first:border-t-0 tw:sm:grid-cols-[minmax(0,1fr)_12rem_auto] tw:sm:gap-x-6 tw:sm:px-6"
    >
      <div class="tw:col-span-2 tw:min-w-0 tw:sm:col-span-1">
        <NuxtLink
          :to="localePath(`/event/${row.eventUID}`)"
          class="tw:font-bold tw:hover:underline tw:hover:decoration-brand tw:hover:decoration-2 tw:hover:underline-offset-4"
        >
          {{ row.event.title }}
        </NuxtLink>
        <p
          class="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-sm tw:text-muted-foreground"
        >
          <span class="tw:first-letter:uppercase">{{ when(row) }}</span>
          <span
            v-if="placeOf(row.event.location?.name).code"
            class="tw:rounded tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:text-plate-foreground"
          >
            {{ placeOf(row.event.location?.name).code }}
          </span>
        </p>
      </div>

      <span
        v-if="row.status === 'attending'"
        class="tw:inline-flex tw:items-center tw:gap-2 tw:justify-self-start tw:rounded-full tw:bg-muted tw:px-3 tw:pt-1 tw:pb-0.5 tw:text-sm tw:font-bold tw:text-plate"
      >
        <span
          class="tw:size-2 tw:rounded-full tw:bg-plate"
          aria-hidden="true"
        />
        {{ $t('user.page.attending') }}
      </span>
      <span
        v-else
        class="tw:justify-self-start tw:rounded-full tw:bg-signal tw:px-3 tw:pt-1 tw:pb-0.5 tw:text-sm tw:font-bold tw:text-signal-foreground"
      >
        {{ $t('user.page.queued', { n: row.position }) }}
      </span>

      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="outline" :disabled="busy === row.eventUID">
            {{ $t('user.page.withdraw') }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent class="tw:rounded-md tw:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle class="tw:text-lg tw:font-bold">
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
