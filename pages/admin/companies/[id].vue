<script setup lang="ts">
  import CompanyForm from '@/components/admin/form/CompanyForm.vue'
  import type { CompanyInput } from '@/contracts/company'

  type Listed = Partial<Omit<CompanyInput, 'resumeAccess'>> & {
    logo?: string | null
    entitlements?: string[]
  }

  const route = useRoute()
  const uid = String(route.params.id)
  const { data: companies } = await useFetch<Record<string, Listed>>(
    '/api/v1/company',
    { query: { companyUID: uid } },
  )
  const company = computed(() => companies.value?.[uid])
</script>

<template>
  <CompanyForm
    v-if="company"
    :uid="uid"
    :logo="company.logo"
    :initial="{
      name: company.name,
      tier: company.tier,
      webpage: company.webpage,
      description: company.description ?? '',
      resumeAccess: company.entitlements?.includes('ent:resume:view') === true,
    }"
  />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.companies.form.missing') }}
  </p>
</template>
