<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import FieldError from '@/components/form/FieldError.vue'
  import TextField from '@/components/form/TextField.vue'
  import RichText from '@/components/admin/form/RichText.vue'
  import { Button } from '@/components/ui/button'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Textarea } from '@/components/ui/textarea'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { useHostCompanies } from '@/composables/admin/useHostCompanies'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import {
    DEADLINE_TYPES,
    JOB_LISTINGS,
    JOB_TYPES,
    checkedJobInput,
    toV1Job,
    type JobInput,
  } from '@/contracts/job'

  const props = withDefaults(
    defineProps<{
      uid?: string
      initial: Partial<JobInput>
      /** The list the form returns to: the admin panel's or the company panel's */
      panel?: string
    }>(),
    { uid: undefined, panel: '/admin/jobs' },
  )

  const { t } = useI18n()
  const localePath = useLocalePath()
  const {
    allowed,
    choices: companyOptions,
    onlyChoice,
  } = await useHostCompanies({
    resource: 'job',
    uid: props.uid,
    current: props.initial.companyUID,
  })
  const panelName = computed(() =>
    props.panel.startsWith('/company/')
      ? 'company.admin.jobs.name'
      : 'admin.jobs.name',
  )

  const { form, submit, saving } = useResourceForm({
    schema: checkedJobInput,
    initial: props.initial,
    back: props.panel,
    saved: () =>
      t(props.uid ? 'admin.jobs.form.updated' : 'admin.jobs.form.created'),
    save: async (values) => {
      if (props.uid) {
        await $fetch('/api/v1/job', {
          method: 'PUT',
          body: { ...toV1Job(values), jobUID: props.uid },
        })
        return props.uid
      }
      await $fetch('/api/v1/job', { method: 'POST', body: toV1Job(values) })
    },
  })
  watchEffect(() => {
    if (onlyChoice.value && !form.values.companyUID)
      form.setFieldValue('companyUID', onlyChoice.value)
  })
  const listing = computed(() => form.values.listing ?? 'text')

  // keep what was written when switching: rich text becomes a plain summary, and back
  const switchListing = (next: 'text' | 'link') => {
    if (next === listing.value) return
    const description = String(form.values.description ?? '')
    form.setFieldValue('listing', next)
    form.setFieldValue(
      'description',
      next === 'link'
        ? description
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 300)
        : description && `<p>${description}</p>`,
    )
  }
</script>

<template>
  <p v-if="!allowed" class="text-muted-foreground">
    {{ $t('admin.jobs.form.missing') }}
  </p>
  <form
    v-else
    class="flex max-w-3xl flex-col gap-6"
    novalidate
    @submit="submit"
  >
    <NuxtLink
      :to="localePath(panel)"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t(panelName) }}
    </NuxtLink>
    <h1
      class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
    >
      {{ $t(uid ? 'admin.jobs.form.edit_title' : 'admin.jobs.form.new_title') }}
    </h1>

    <div class="grid gap-5 rounded-lg border bg-card p-4 lg:grid-cols-2 lg:p-6">
      <FormField v-slot="{ value }" name="listing">
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.listing') }}</FormLabel>
          <div
            role="radiogroup"
            :aria-label="$t('admin.jobs.form.listing')"
            class="grid gap-2 sm:grid-cols-2"
          >
            <button
              v-for="option in JOB_LISTINGS"
              :key="option"
              type="button"
              role="radio"
              :aria-checked="value === option"
              class="rounded-md border p-3 text-left transition-colors hover:bg-accent aria-checked:border-plate aria-checked:bg-plate aria-checked:text-plate-foreground"
              @click="switchListing(option)"
            >
              <span class="block font-semibold">
                {{ $t(`admin.jobs.form.listings.${option}.name`) }}
              </span>
              <span class="block text-sm opacity-80">
                {{ $t(`admin.jobs.form.listings.${option}.hint`) }}
              </span>
            </button>
          </div>
        </FormItem>
      </FormField>

      <TextField
        name="title"
        :label="$t('admin.jobs.form.title')"
        class="lg:col-span-2"
      />

      <FormField v-slot="{ componentField }" name="companyUID">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.company') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="$t('admin.jobs.form.choose_company')"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem
                v-for="option in companyOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="jobType">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.type') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="$t('admin.jobs.form.choose_type')" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem v-for="type in JOB_TYPES" :key="type" :value="type">
                {{
                  $t(`admin.jobs.attributes.jobtype.${type.replace('-', '_')}`)
                }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError />
        </FormItem>
      </FormField>

      <TextField name="location" :label="$t('admin.jobs.form.location')" />

      <FormField v-slot="{ componentField }" name="deadlineType">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.deadline') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem
                v-for="type in DEADLINE_TYPES"
                :key="type"
                :value="type"
              >
                {{ $t(`admin.jobs.form.deadline_type.${type}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="form.values.deadlineType === 'rolling'"
            class="text-sm text-muted-foreground"
          >
            {{ $t('admin.jobs.form.rolling_hint') }}
          </p>
        </FormItem>
      </FormField>

      <FormField
        v-if="(form.values.deadlineType ?? 'date') === 'date'"
        v-slot="{ componentField }"
        name="deadline"
      >
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.deadline_date') }}</FormLabel>
          <FormControl>
            <Input type="date" v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="applicationLink">
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t(`admin.jobs.form.link_${listing}`) }}</FormLabel>
          <FormControl>
            <Input type="url" placeholder="https://" v-bind="componentField" />
          </FormControl>
          <p v-if="listing === 'text'" class="text-sm text-muted-foreground">
            {{ $t('admin.jobs.form.link_hint') }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField
        v-if="listing === 'text'"
        v-slot="{ value, handleChange, errorMessage }"
        name="description"
      >
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.description') }}</FormLabel>
          <FormControl>
            <RichText
              :model-value="value"
              :invalid="!!errorMessage"
              @update:model-value="handleChange"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
      <FormField v-else v-slot="{ componentField }" name="description">
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.summary') }}</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" rows="3" maxlength="300" />
          </FormControl>
          <p class="text-sm text-muted-foreground">
            {{ $t('admin.jobs.form.summary_hint') }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>
    </div>

    <div class="flex flex-wrap gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t(uid ? 'admin.jobs.form.save' : 'admin.jobs.form.create') }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath(panel)">
          {{ $t('admin.list.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
