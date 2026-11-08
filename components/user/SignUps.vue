<script setup lang="ts">
  import { Badge } from '@/components/ui/badge'
  import ConfirmDialog from '@/components/user/ConfirmDialog.vue'
  import FormButton from '@/components/user/FormButton.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { placeOf } from '@/lib/events'
  import { formatWhen } from '@/lib/time'
  import type { SignUpRow } from '@/lib/user/signUps'

  defineProps<{ rows: SignUpRow[] }>()
  const emit = defineEmits<{ withdrawn: [] }>()

  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  const subtitle = (row: SignUpRow) =>
    [
      formatWhen(row.event.date?.start, locale.value, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      placeOf(row.event.location?.name).code,
    ]
      .filter(Boolean)
      .join(' · ')

  const asked = ref<SignUpRow | null>(null)
  // the dialog keeps its words while it fades out
  const shown = ref<SignUpRow | null>(null)
  watch(asked, (row) => {
    if (row) shown.value = row
  })
  const busy = ref(false)
  const withdraw = async () => {
    const row = asked.value
    if (!row) return
    busy.value = true
    try {
      await $fetch('/api/v1/event/register', {
        method: 'DELETE',
        body: { eventUID: row.eventUID },
      })
      notify(
        t('user.page.withdrawn', { title: row.event.title ?? '' }),
        'success',
      )
      asked.value = null
      emit('withdrawn')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <ul>
    <li
      v-for="row in rows"
      :key="row.eventUID"
      class="tw:flex tw:min-h-16 tw:items-center tw:gap-4 tw:py-2"
    >
      <div class="tw:min-w-0 tw:flex-1">
        <p class="tw:truncate tw:leading-6 tw:tracking-[0.009375em]">
          <NuxtLink
            :to="localePath(`/event/${row.eventUID}`)"
            class="tw:font-bold tw:text-brand"
          >
            {{ row.event.title }}
          </NuxtLink>
        </p>
        <p
          class="tw:text-sm tw:leading-5 tw:tracking-[0.0178571429em] tw:text-black/60 tw:first-letter:uppercase"
        >
          {{ subtitle(row) }}
        </p>
        <Badge
          class="tw:mt-1 tw:h-6 tw:rounded-full tw:border-0 tw:px-2 tw:text-xs tw:font-normal tw:tracking-[0.0178571429em]"
          :class="
            row.status === 'attending'
              ? 'tw:bg-[#2BA84A]/12 tw:text-[#2BA84A]'
              : 'tw:bg-[#E8871E]/12 tw:text-[#E8871E]'
          "
        >
          {{
            row.status === 'attending'
              ? $t('user.page.attending')
              : $t('user.page.queued', { n: row.position })
          }}
        </Badge>
      </div>
      <FormButton
        size="small"
        look="outlined"
        tone="error"
        @click="asked = row"
      >
        {{ $t('user.page.withdraw') }}
      </FormButton>
    </li>
  </ul>

  <ConfirmDialog
    :open="!!asked"
    :title="$t('user.page.withdraw_title', { title: shown?.event.title })"
    :text="
      shown?.status === 'attending'
        ? $t('user.page.withdraw_place')
        : $t('user.page.withdraw_queue')
    "
    @update:open="asked = null"
  >
    <template #actions>
      <FormButton
        size="default"
        look="text"
        :disabled="busy"
        @click="asked = null"
      >
        {{ $t('user.page.keep') }}
      </FormButton>
      <FormButton
        size="default"
        look="text"
        tone="error"
        :loading="busy"
        @click="withdraw"
      >
        {{ $t('user.page.withdraw') }}
      </FormButton>
    </template>
  </ConfirmDialog>
</template>
