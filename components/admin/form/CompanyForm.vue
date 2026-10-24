<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import FieldError from '@/components/admin/form/FieldError.vue'
  import LogoField from '@/components/admin/form/LogoField.vue'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { Textarea } from '@/components/ui/textarea'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { alertError } from '@/composables/useAlerts'
  import { COMPANY_TYPES, CompanyInput } from '@/contracts/company'

  const props = defineProps<{
    uid?: string
    initial: Partial<CompanyInput>
    logo?: string | null
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const logoFile = ref<File | null>(null)
  // new companies get a registration code straight away, unless the admin opts out
  const createCode = ref(true)

  /** Upload a logo and return its address; the image endpoint stores it under the company */
  const uploadLogo = async (companyUID: string, file: File) => {
    const body = new FormData()
    body.append('file', file)
    body.append('storagePath', `companies/${companyUID}`)
    const { URL } = await $fetch<{ URL: string }>('/api/v1/image', {
      method: 'POST',
      body,
    })
    return URL
  }

  const { submit, saving } = useResourceForm({
    schema: CompanyInput,
    initial: props.initial,
    back: '/admin/companies',
    saved: () =>
      t(
        props.uid
          ? 'admin.companies.form.updated'
          : 'admin.companies.form.created',
      ),
    save: async (values) => {
      if (props.uid) {
        const logo = logoFile.value
          ? await uploadLogo(props.uid, logoFile.value)
          : undefined
        await $fetch('/api/v1/company', {
          method: 'PUT',
          body: { ...values, ...(logo && { logo }), companyUID: props.uid },
        })
        return props.uid
      }

      const { companyUID } = await $fetch<{ companyUID: string }>(
        '/api/v1/company',
        { method: 'POST', body: values },
      )
      // the company exists now: report a failed logo or code, but do not save it twice
      try {
        if (logoFile.value) {
          const logo = await uploadLogo(companyUID, logoFile.value)
          await $fetch('/api/v1/company', {
            method: 'PUT',
            body: { companyUID, logo },
          })
        }
        if (createCode.value) {
          await $fetch('/api/v1/code', {
            method: 'POST',
            query: { companyUID },
          })
        }
      } catch (error) {
        alertError(error)
      }
      return companyUID
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
      :to="localePath('/admin/companies')"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t('admin.companies.name') }}
    </NuxtLink>
    <h1
      class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{
        $t(
          uid
            ? 'admin.companies.form.edit_title'
            : 'admin.companies.form.new_title',
        )
      }}
    </h1>

    <div
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:grid-cols-2 tw:lg:p-6"
    >
      <FormField v-slot="{ componentField }" name="name">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.companies.form.name') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="type">
        <FormItem>
          <FormLabel>{{ $t('admin.companies.form.type') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="tw:w-full">
                <SelectValue
                  :placeholder="$t('admin.companies.form.choose_type')"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem
                v-for="type in COMPANY_TYPES"
                :key="type"
                :value="type"
              >
                {{ $t(`admin.companies.type.${type.replace('-', '_')}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="webpage">
        <FormItem>
          <FormLabel>{{ $t('admin.companies.form.webpage') }}</FormLabel>
          <FormControl>
            <Input type="url" placeholder="https://" v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <div class="tw:flex tw:flex-col tw:gap-2 tw:lg:col-span-2">
        <Label>{{ $t('admin.companies.form.logo') }}</Label>
        <LogoField v-model="logoFile" :current="logo" />
      </div>

      <FormField v-slot="{ componentField }" name="description">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.companies.form.description') }}</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" rows="5" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField
        v-slot="{ value, handleChange }"
        name="cvAccess"
        type="checkbox"
      >
        <FormItem class="tw:flex tw:items-start tw:gap-3 tw:lg:col-span-2">
          <FormControl>
            <Checkbox
              :model-value="value"
              class="tw:mt-0.5"
              @update:model-value="handleChange"
            />
          </FormControl>
          <div>
            <FormLabel>{{ $t('admin.companies.form.cv_access') }}</FormLabel>
            <p class="tw:text-sm tw:text-muted-foreground">
              {{ $t('admin.companies.form.cv_access_hint') }}
            </p>
          </div>
        </FormItem>
      </FormField>

      <label
        v-if="!uid"
        class="tw:flex tw:items-start tw:gap-3 tw:lg:col-span-2"
      >
        <Checkbox v-model="createCode" class="tw:mt-0.5" />
        <span>
          <span class="tw:block tw:text-sm tw:font-medium">
            {{ $t('admin.companies.form.create_code') }}
          </span>
          <span class="tw:block tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.companies.form.create_code_hint') }}
          </span>
        </span>
      </label>
    </div>

    <div class="tw:flex tw:flex-wrap tw:gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{
          $t(uid ? 'admin.companies.form.save' : 'admin.companies.form.create')
        }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/admin/companies')">
          {{ $t('admin.list.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
