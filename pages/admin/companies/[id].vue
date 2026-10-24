<script setup lang="ts">
  import CompanyForm from '@/components/admin/form/CompanyForm.vue'
  import type { CompanyInput } from '@/contracts/company'

  const route = useRoute()
  const uid = String(route.params.id)
  const { data: companies } = await useFetch<
    Record<string, Partial<CompanyInput> & { logo?: string | null }>
  >('/api/v1/company', { query: { companyUID: uid } })
  const company = computed(() => companies.value?.[uid])
</script>

<template>
  <CompanyForm
    v-if="company"
    :uid="uid"
    :logo="company.logo"
    :initial="{
      name: company.name,
      type: company.type,
      webpage: company.webpage,
      description: company.description ?? '',
      cvAccess: company.cvAccess === true,
    }"
  />
  <p v-else class="tw:text-muted-foreground">
    {{ $t('admin.companies.form.missing') }}
  </p>
</template>
