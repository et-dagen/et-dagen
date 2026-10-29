<script setup lang="ts">
  import ProfileForm from '@/components/company/ProfileForm.vue'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { CompanyUid } from '@/domain/business/company'

  definePageMeta({ layout: 'admin', protected: true, area: 'profile' })

  interface StoredCompany {
    name?: string
    webpage?: string
    description?: string
    logo?: string
  }

  const auth = useAuthStore()
  const route = useRoute()
  const { t } = useI18n()
  useHead({ title: () => t('company.admin.profile.name') })

  const { data: companies } = await useFetch<Record<string, StoredCompany>>(
    '/api/v1/company',
    { key: 'company-profile' },
  )

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
        (companies.value?.[a]?.name ?? '').localeCompare(
          companies.value?.[b]?.name ?? '',
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
  <div class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-6">
    <div class="tw:flex tw:flex-col tw:gap-2">
      <h1
        class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
      >
        {{ $t('company.admin.profile.name') }}
      </h1>
      <p class="tw:text-muted-foreground">
        {{ $t('company.admin.profile.lead') }}
      </p>
    </div>

    <div v-if="editable.length > 1" class="tw:flex tw:flex-col tw:gap-2">
      <label id="profile-company" class="tw:text-sm tw:font-medium">
        {{ $t('company.admin.profile.company') }}
      </label>
      <Select :model-value="chosen" @update:model-value="choose">
        <SelectTrigger aria-labelledby="profile-company" class="tw:w-72">
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
    <p v-else class="tw:rounded-lg tw:border tw:bg-card tw:p-6">
      {{ $t('company.admin.profile.none') }}
    </p>
  </div>
</template>
