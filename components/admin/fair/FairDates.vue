<script setup lang="ts">
  import { Save } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { alertError, notify } from '@/composables/useAlerts'
  import { fieldTime } from '@/lib/admin/programmes'

  const props = defineProps<{ start?: string; end?: string }>()

  const { t } = useI18n()
  const start = ref(fieldTime(props.start))
  const end = ref(fieldTime(props.end))
  const saving = ref(false)

  async function save() {
    saving.value = true
    try {
      await $fetch('/api/v1/generalInfo', {
        method: 'PUT',
        body: { start: start.value, end: end.value },
      })
      notify(t('admin.fair.dates.saved'), 'success')
    } catch (error) {
      alertError(error)
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <section
    aria-labelledby="fair-dates"
    class="tw:flex tw:flex-col tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5 tw:lg:p-6"
  >
    <div>
      <h2 id="fair-dates" class="tw:text-lg tw:font-bold">
        {{ $t('admin.fair.dates.title') }}
      </h2>
      <p class="tw:text-sm tw:text-muted-foreground">
        {{ $t('admin.fair.dates.intro') }}
      </p>
    </div>
    <form
      class="tw:grid tw:gap-4 tw:sm:grid-cols-[1fr_1fr_auto] tw:sm:items-end"
      @submit.prevent="save"
    >
      <div class="tw:flex tw:flex-col tw:gap-2">
        <Label for="fair-start">{{ $t('admin.fair.dates.start') }}</Label>
        <Input id="fair-start" v-model="start" type="datetime-local" required />
      </div>
      <div class="tw:flex tw:flex-col tw:gap-2">
        <Label for="fair-end">{{ $t('admin.fair.dates.end') }}</Label>
        <Input
          id="fair-end"
          v-model="end"
          type="datetime-local"
          :min="start || undefined"
          required
        />
      </div>
      <Button type="submit" class="tw:h-10" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t('admin.fair.dates.save') }}
      </Button>
    </form>
  </section>
</template>
