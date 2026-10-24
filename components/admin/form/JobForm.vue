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
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { JOB_TYPES, JobInput } from '@/contracts/job'

  const props = defineProps<{
    uid?: string
    initial: Partial<JobInput>
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { data: companies } =
    await useFetch<Record<string, { name?: string }>>('/api/v1/company')
  const companyOptions = computed(() =>
    Object.entries(companies.value ?? {})
      .map(([value, company]) => ({ value, label: company.name ?? value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'nb')),
  )

  const { submit, saving } = useResourceForm({
    schema: JobInput,
    initial: props.initial,
    back: '/admin/jobs',
    saved: () =>
      t(props.uid ? 'admin.jobs.form.updated' : 'admin.jobs.form.created'),
    save: async (values) => {
      if (props.uid) {
        await $fetch('/api/v1/job', {
          method: 'PUT',
          body: { ...values, jobUID: props.uid },
        })
        return props.uid
      }
      await $fetch('/api/v1/job', { method: 'POST', body: values })
    },
  })
</script>

<template>
  <form
    class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-6"
    novalidate
    @submit="submit"
  >
    <NuxtLink
      :to="localePath('/admin/jobs')"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t('admin.jobs.name') }}
    </NuxtLink>
    <h1
      class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t(uid ? 'admin.jobs.form.edit_title' : 'admin.jobs.form.new_title') }}
    </h1>

    <div
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:grid-cols-2 tw:lg:p-6"
    >
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

      <FormField v-slot="{ componentField }" name="deadline">
        <FormItem>
          <FormLabel>{{ $t('admin.jobs.form.deadline') }}</FormLabel>
          <FormControl>
            <Input type="date" v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="applicationLink">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.jobs.form.link') }}</FormLabel>
          <FormControl>
            <Input type="url" placeholder="https://" v-bind="componentField" />
          </FormControl>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.jobs.form.link_hint') }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField
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
    </div>

    <div class="tw:flex tw:flex-wrap tw:gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t(uid ? 'admin.jobs.form.save' : 'admin.jobs.form.create') }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/admin/jobs')">
          {{ $t('admin.list.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
