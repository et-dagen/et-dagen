<script setup lang="ts">
  import { Pencil, Plus, Trash2 } from '@lucide/vue'
  import DeleteDialog from '@/components/admin/DeleteDialog.vue'
  import FilterChips from '@/components/admin/FilterChips.vue'
  import ProgrammeEditor from '@/components/admin/fair/ProgrammeEditor.vue'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { alertError, notify } from '@/composables/useAlerts'
  import type { ProgrammeRow } from '@/lib/admin/programmes'

  const props = defineProps<{ rows: ProgrammeRow[] }>()
  const emit = defineEmits<{ changed: [] }>()

  const { t } = useI18n()

  type Shown = 'all' | 'open' | 'closed'
  const shown = ref<Shown>('all')
  const filters = computed(() =>
    (['all', 'open', 'closed'] as const).map((value) => ({
      value,
      label: t(`admin.fair.programmes.filter.${value}`),
      count: props.rows.filter(
        (row) => value === 'all' || row.open === (value === 'open'),
      ).length,
    })),
  )
  const visible = computed(() =>
    props.rows.filter(
      (row) => shown.value === 'all' || row.open === (shown.value === 'open'),
    ),
  )

  // one editor at a time: a new programme, or the row with this code
  const editing = ref<'new' | string | null>(null)
  const busy = ref(false)

  async function run(work: () => Promise<string>) {
    busy.value = true
    try {
      notify(await work(), 'success')
      editing.value = null
      emit('changed')
    } catch (error) {
      alertError(error)
    } finally {
      busy.value = false
    }
  }

  const add = (programme: ProgrammeRow) =>
    run(async () => {
      const added = await $fetch<ProgrammeRow>('/api/v1/programme', {
        method: 'POST',
        body: programme,
      })
      return t('admin.fair.programmes.added', { name: added.name })
    })

  const update = ({ code, ...details }: ProgrammeRow) =>
    run(async () => {
      const saved = await $fetch<ProgrammeRow>(
        `/api/v1/programme/${encodeURIComponent(code)}`,
        { method: 'PUT', body: details },
      )
      return t('admin.fair.programmes.updated', { name: saved.name })
    })

  const removing = ref<ProgrammeRow | null>(null)
  const confirming = computed({
    get: () => removing.value !== null,
    set: (open) => {
      if (!open) removing.value = null
    },
  })
  async function remove() {
    const row = removing.value
    if (!row) return
    await run(async () => {
      await $fetch(`/api/v1/programme/${encodeURIComponent(row.code)}`, {
        method: 'DELETE',
      })
      return t('admin.fair.programmes.removed', { name: row.name })
    })
    removing.value = null
  }
</script>

<template>
  <section
    aria-labelledby="fair-programmes"
    class="tw:flex tw:flex-col tw:gap-4"
  >
    <div class="tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-end">
      <div>
        <h2 id="fair-programmes" class="tw:text-lg tw:font-bold">
          {{ $t('admin.fair.programmes.title') }}
        </h2>
        <p class="tw:max-w-2xl tw:text-sm tw:text-muted-foreground">
          {{ $t('admin.fair.programmes.intro') }}
        </p>
      </div>
      <Button
        class="tw:h-10 tw:shrink-0 tw:sm:ml-auto"
        :disabled="editing === 'new'"
        @click="editing = 'new'"
      >
        <Plus aria-hidden="true" />
        {{ $t('admin.fair.programmes.add') }}
      </Button>
    </div>

    <FilterChips
      v-model="shown"
      :label="$t('admin.fair.programmes.filter.label')"
      :options="filters"
    />

    <div
      class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
    >
      <ProgrammeEditor
        v-if="editing === 'new'"
        :busy="busy"
        @save="add"
        @cancel="editing = null"
      />
      <ul class="tw:divide-y">
        <li v-for="row in visible" :key="row.code">
          <ProgrammeEditor
            v-if="editing === row.code"
            :initial="row"
            :busy="busy"
            @save="update"
            @cancel="editing = null"
          />
          <div v-else class="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3">
            <div class="tw:min-w-0 tw:flex-1">
              <p
                class="tw:font-semibold"
                :class="!row.open && 'tw:text-muted-foreground'"
              >
                {{ row.name }}
              </p>
              <p class="tw:text-sm tw:text-muted-foreground">
                <span class="tw:font-mono">{{ row.code }}</span
                >{{ ` · ${$t(`degree.${row.degree}`)}` }}
              </p>
            </div>
            <Badge v-if="!row.open" variant="secondary">
              {{ $t('admin.fair.programmes.closed') }}
            </Badge>
            <div class="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
              <Button
                variant="ghost"
                size="icon"
                :disabled="busy"
                :aria-label="
                  $t('admin.fair.programmes.edit', { name: row.name })
                "
                @click="editing = row.code"
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="tw:text-destructive tw:hover:bg-destructive/10 tw:hover:text-destructive"
                :disabled="busy"
                :aria-label="
                  $t('admin.fair.programmes.remove', { name: row.name })
                "
                @click="removing = row"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
        </li>
      </ul>
      <p
        v-if="visible.length === 0 && editing !== 'new'"
        class="tw:p-6 tw:text-muted-foreground"
      >
        {{ $t('admin.fair.programmes.empty') }}
      </p>
    </div>

    <DeleteDialog
      v-model:open="confirming"
      :title="$t('admin.fair.programmes.confirm.title')"
      :description="$t('admin.fair.programmes.confirm.text')"
      :confirm="$t('admin.fair.programmes.confirm.action')"
      :items="
        removing
          ? [
              {
                key: removing.code,
                label: removing.name,
                detail: `${removing.code} · ${$t(`degree.${removing.degree}`)}`,
              },
            ]
          : []
      "
      :loading="busy"
      @confirm="remove"
    />
  </section>
</template>
