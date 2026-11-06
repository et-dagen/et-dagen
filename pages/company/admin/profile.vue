<script setup lang="ts">
  import { useAuthStore } from '@/stores/authStore'
  import { useCompanies } from '@/composables/useCompanies'
  import { companyName } from '@/lib/companies'
  import ProfileForm from '@/components/company/ProfileForm.vue'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { CompanyUid } from '@/domain/business/company'

  definePageMeta({ layout: 'admin', area: 'profile' })

  const auth = useAuthStore()
  const route = useRoute()
  const { t } = useI18n()
  useHead({ title: () => t('company.admin.profile.name') })

  const { data: companies } = await useCompanies()

  // an admin may edit every company; anyone else the companies they belong to and may edit
  const editable = computed(() => {
    const uids = auth.can('company', 'update', undefined)
      ? Object.keys(companies.value ?? {})
      : [...(auth.currentSubject?.companies.keys() ?? [])].filter((uid) =>
          auth.can('company', 'update', { uid: CompanyUid.parse(uid) }),
        )
    return uids
      .filter((uid) => companies.value?.[uid])
      .sort((a, b) =>
        companyName(companies.value, a).localeCompare(
          companyName(companies.value, b),
          'nb',
        ),
      )
  })

  // the form returns here with ?changed=<uid> after saving, so the same company stays chosen
  const chosen = computed(() => {
    const asked = String(route.query.changed ?? route.query.company ?? '')
    return editable.value.includes(asked) ? asked : editable.value[0]
  })
  const company = computed(() =>
    chosen.value ? companies.value?.[chosen.value] : undefined,
  )
  const choose = (uid: unknown) =>
    navigateTo({ query: { company: String(uid) } }, { replace: true })
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1
        class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
      >
        {{ $t('company.admin.profile.name') }}
      </h1>
      <p class="text-muted-foreground">
        {{ $t('company.admin.profile.lead') }}
      </p>
    </div>

    <div v-if="editable.length > 1" class="flex flex-col gap-2">
      <label id="profile-company" class="text-sm font-medium">
        {{ $t('company.admin.profile.company') }}
      </label>
      <Select :model-value="chosen" @update:model-value="choose">
        <SelectTrigger aria-labelledby="profile-company" class="w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="uid in editable" :key="uid" :value="uid">
            {{ companies?.[uid]?.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <ProfileForm
      v-if="chosen && company"
      :key="chosen"
      :uid="chosen"
      :logo="company.logo"
      :initial="{
        name: company.name ?? '',
        webpage: company.webpage ?? '',
        description: company.description ?? '',
      }"
    />
    <p v-else class="rounded-lg border bg-card p-6">
      {{ $t('company.admin.profile.none') }}
    </p>
  </div>
</template>
