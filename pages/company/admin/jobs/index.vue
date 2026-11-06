<script setup lang="ts">
  import { Pencil, Plus } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useCompanies } from '@/composables/useCompanies'
  import { Button } from '@/components/ui/button'
  import { CompanyUid } from '@/domain/business/company'
  import { deadlineOf, formatWhen } from '@/lib/time'

  definePageMeta({ layout: 'admin', area: 'jobs' })

  interface Row {
    title?: string
    companyUID?: string
    deadline?: string
  }

  const auth = useAuthStore()
  const localePath = useLocalePath()
  const { localeProperties } = useI18n()
  const locale = computed(() => localeProperties.value.language ?? 'nb-NO')

  const [{ data: jobs }, { data: companies }] = await Promise.all([
    useFetch<Record<string, Row>>('/api/v1/job'),
    useCompanies(),
  ])

  // the jobs of the companies this user may manage, latest deadline first
  const managed = computed(() =>
    Object.entries(jobs.value ?? {})
      .filter(
        ([, job]) =>
          !!job.companyUID &&
          auth.can('job', 'update', {
            companyUid: CompanyUid.parse(job.companyUID),
          }),
      )
      .sort(([, a], [, b]) =>
        (deadlineOf(b.deadline) ?? '').localeCompare(
          deadlineOf(a.deadline) ?? '',
        ),
      ),
  )
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
      <h1
        class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
      >
        {{ $t('company.admin.jobs.name') }}
      </h1>
      <Button v-if="auth.canForSome('job', 'create')" as-child>
        <NuxtLink :to="localePath('/company/admin/jobs/new')">
          <Plus aria-hidden="true" />
          {{ $t('company.admin.jobs.new') }}
        </NuxtLink>
      </Button>
    </div>

    <ul v-if="managed.length" class="rounded-lg border bg-card">
      <li
        v-for="[uid, job] in managed"
        :key="uid"
        class="flex flex-wrap items-center justify-between gap-3 border-t p-4 first:border-t-0 lg:px-5"
      >
        <div class="min-w-0">
          <p class="font-bold">{{ job.title }}</p>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ companies?.[job.companyUID ?? '']?.name }}
            <template v-if="job.deadline">
              ·
              {{
                $t('company.admin.jobs.deadline', {
                  date: formatWhen(deadlineOf(job.deadline), locale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                })
              }}
            </template>
          </p>
        </div>
        <Button as-child variant="outline" size="sm">
          <NuxtLink :to="localePath(`/company/admin/jobs/${uid}`)">
            <Pencil aria-hidden="true" />
            {{ $t('company.admin.jobs.edit') }}
          </NuxtLink>
        </Button>
      </li>
    </ul>
    <p
      v-else
      class="rounded-lg border bg-card px-4 py-10 text-center text-muted-foreground"
    >
      {{ $t('company.admin.jobs.empty') }}
    </p>
  </div>
</template>
