<script setup lang="ts">
  import { Save } from '@lucide/vue'
  import { refreshCompanies } from '@/composables/useCompanies'
  import FieldError from '@/components/form/FieldError.vue'
  import LogoField from '@/components/form/LogoField.vue'
  import { Button } from '@/components/ui/button'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Textarea } from '@/components/ui/textarea'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { CompanyProfile } from '@/contracts/company'

  const props = defineProps<{
    uid: string
    initial: Partial<CompanyProfile>
    logo?: string | null
  }>()

  const { t } = useI18n()
  const logoFile = ref<File | null>(null)

  const { submit, saving } = useResourceForm({
    schema: CompanyProfile,
    initial: props.initial,
    back: '/company/admin/profile',
    saved: () => t('company.admin.profile.saved'),
    save: async (values) => {
      await $fetch('/api/v1/company', {
        method: 'PUT',
        body: { ...values, companyUID: props.uid },
      })
      if (logoFile.value) {
        const body = new FormData()
        body.append('companyUID', props.uid)
        body.append('file', logoFile.value)
        await $fetch('/api/v1/company/logo', { method: 'PUT', body })
      }
      await refreshCompanies()
      return props.uid
    },
  })
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit="submit">
    <div class="grid gap-5 rounded-lg border bg-card p-4 lg:grid-cols-2 lg:p-6">
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>{{ $t('admin.companies.form.name') }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" autocomplete="organization" />
          </FormControl>
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

      <div class="flex flex-col gap-2 lg:col-span-2">
        <Label>{{ $t('admin.companies.form.logo') }}</Label>
        <LogoField v-model="logoFile" :current="logo" />
      </div>

      <FormField v-slot="{ componentField }" name="description">
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.companies.form.description') }}</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" rows="6" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
    </div>

    <Button type="submit" :disabled="saving" class="w-fit">
      <Save aria-hidden="true" />
      {{ $t('company.admin.profile.save') }}
    </Button>
  </form>
</template>
