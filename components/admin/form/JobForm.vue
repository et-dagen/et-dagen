<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import FieldError from '@/components/admin/form/FieldError.vue'
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
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import {
    DEADLINE_TYPES,
    JOB_LISTINGS,
    JOB_TYPES,
    checkedJobInput,
    toV1Job,
    type JobInput,
  } from '@/contracts/job'
  import { CompanyUid } from '@/domain/business/company'

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
  const { data: companies } =
    await useFetch<Record<string, { name?: string }>>('/api/v1/company')
  // a company user or coordinator may only post for the companies they manage
  const auth = useAuthStore()
  const mayPost = (value: string) =>
    !!value &&
    auth.can('job', props.uid ? 'update' : 'create', {
      companyUid: CompanyUid.parse(value),
    })
  // a company user who opens another company's job gets no form to fill in
  const allowed = computed(
    () => !props.uid || mayPost(String(props.initial.companyUID ?? '')),
  )
  const panelName = computed(() =>
    props.panel.startsWith('/company/')
      ? 'company.admin.jobs.name'
      : 'admin.jobs.name',
  )
  const companyOptions = computed(() =>
    Object.entries(companies.value ?? {})
      .map(([value, company]) => ({ value, label: company.name ?? value }))
      .filter((option) => mayPost(option.value))
      .sort((a, b) => a.label.localeCompare(b.label, 'nb')),
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
  // with one company to choose from, a new entry is for that company
  watchEffect(() => {
    const [only, ...others] = companyOptions.value
    if (!props.uid && only && !others.length && !form.values.companyUID)
      form.setFieldValue('companyUID', only.value)
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
  <p v-if="!allowed" class="tw:text-muted-foreground">
    {{ $t('admin.jobs.form.missing') }}
  </p>
  <form
    v-else
    class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-6"
    novalidate
    @submit="submit"
  >
    <NuxtLink
      :to="localePath(panel)"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t(panelName) }}
    </NuxtLink>
    <h1
      class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t(uid ? 'admin.jobs.form.edit_title' : 'admin.jobs.form.new_title') }}
    </h1>

    <div
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:grid-cols-2 tw:lg:p-6"
    >
      <FormField v-slot="{ value }" name="listing">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.listing') }}</FormLabel>
          <div
            role="radiogroup"
            :aria-label="$t('admin.jobs.form.listing')"
            class="tw:grid tw:gap-2 tw:sm:grid-cols-2"
          >
            <button
              v-for="option in JOB_LISTINGS"
              :key="option"
              type="button"
              role="radio"
              :aria-checked="value === option"
              class="tw:rounded-md tw:border tw:p-3 tw:text-left tw:transition-colors tw:hover:bg-accent tw:aria-checked:border-plate tw:aria-checked:bg-plate tw:aria-checked:text-plate-foreground"
              @click="switchListing(option)"
            >
              <span class="tw:block tw:font-semibold">
                {{ $t(`admin.jobs.form.listings.${option}.name`) }}
              </span>
              <span class="tw:block tw:text-sm tw:opacity-80">
                {{ $t(`admin.jobs.form.listings.${option}.hint`) }}
              </span>
            </button>
          </div>
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="title">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.title') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="companyUID">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.company') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="tw:w-full">
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
              <SelectTrigger class="tw:w-full">
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

      <FormField v-slot="{ componentField }" name="location">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.location') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="deadlineType">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.deadline') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="tw:w-full">
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
            class="tw:text-sm tw:text-muted-foreground"
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
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t(`admin.jobs.form.link_${listing}`) }}</FormLabel>
          <FormControl>
            <Input type="url" placeholder="https://" v-bind="componentField" />
          </FormControl>
          <p
            v-if="listing === 'text'"
            class="tw:text-sm tw:text-muted-foreground"
          >
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
        <FormItem class="tw:lg:col-span-2">
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
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.summary') }}</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" rows="3" maxlength="300" />
          </FormControl>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.jobs.form.summary_hint') }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>
    </div>

    <div class="tw:flex tw:flex-wrap tw:gap-3">
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
