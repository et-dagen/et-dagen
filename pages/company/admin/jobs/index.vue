<script setup lang="ts">
  import { Pencil, Plus } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { CompanyUid } from '@/domain/business/company'
  import { deadlineOf, formatWhen } from '@/lib/admin/time'

  definePageMeta({ layout: 'admin', protected: true, area: 'jobs' })

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
    useFetch<Record<string, { name?: string }>>('/api/v1/company'),
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
  <div class="tw:flex tw:flex-col tw:gap-4">
    <div
      class="tw:mb-2 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3"
    >
      <h1
        class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
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

    <ul v-if="managed.length" class="tw:rounded-lg tw:border tw:bg-card">
      <li
        v-for="[uid, job] in managed"
        :key="uid"
        class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:p-4 tw:first:border-t-0 tw:lg:px-5"
      >
        <div class="tw:min-w-0">
          <p class="tw:font-bold">{{ job.title }}</p>
          <p class="tw:mt-1 tw:text-sm tw:text-muted-foreground">
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
      class="tw:rounded-lg tw:border tw:bg-card tw:px-4 tw:py-10 tw:text-center tw:text-muted-foreground"
    >
      {{ $t('company.admin.jobs.empty') }}
    </p>
  </div>
</template>
