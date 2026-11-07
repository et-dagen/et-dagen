<script setup lang="ts">
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
  <VList lines="two" class="py-0">
    <VListItem v-for="row in rows" :key="row.eventUID" class="px-0">
      <VListItemTitle>
        <NuxtLink
          :to="localePath(`/event/${row.eventUID}`)"
          class="text-primary font-weight-bold"
        >
          {{ row.event.title }}
        </NuxtLink>
      </VListItemTitle>
      <VListItemSubtitle class="signup__when">
        {{ subtitle(row) }}
      </VListItemSubtitle>
      <VChip
        size="small"
        class="mt-1"
        :color="row.status === 'attending' ? 'success' : 'warning'"
      >
        {{
          row.status === 'attending'
            ? $t('user.page.attending')
            : $t('user.page.queued', { n: row.position })
        }}
      </VChip>
      <template #append>
        <VBtn
          size="small"
          variant="outlined"
          color="error"
          @click="asked = row"
        >
          {{ $t('user.page.withdraw') }}
        </VBtn>
      </template>
    </VListItem>
  </VList>

  <VDialog
    :model-value="!!asked"
    max-width="500"
    @update:model-value="asked = null"
  >
    <VCard v-if="asked">
      <VCardTitle class="text-wrap">
        {{ $t('user.page.withdraw_title', { title: asked.event.title }) }}
      </VCardTitle>
      <VCardText>
        {{
          asked.status === 'attending'
            ? $t('user.page.withdraw_place')
            : $t('user.page.withdraw_queue')
        }}
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn size="default" :disabled="busy" @click="asked = null">
          {{ $t('user.page.keep') }}
        </VBtn>
        <VBtn size="default" color="error" :loading="busy" @click="withdraw">
          {{ $t('user.page.withdraw') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
  .signup__when::first-letter {
    text-transform: uppercase;
  }
</style>
