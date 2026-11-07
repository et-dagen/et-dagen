<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { STUDY_YEARS } from '@/lib/user/programmes'
  import DietField from '@/components/form/DietField.vue'
  import FieldError from '@/components/form/FieldError.vue'
  import { Button } from '@/components/ui/button'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { profileInput, toV1Profile } from '@/contracts/profile'

  const auth = useAuthStore()
  const { t } = useI18n()
  const localePath = useLocalePath()

  // a company contact has no study programme or year
  const student = !(auth.currentSubject?.roles.includes('company') ?? false)
  const user = auth.user!

  const { yearsOf, nameOf } = await useProgrammes()
  // a student without a programme on record may still pick any year
  const years = computed(() =>
    user.studyProgram ? yearsOf(user.studyProgram) : STUDY_YEARS,
  )

  const { form, submit, saving } = useResourceForm({
    schema: profileInput(student),
    initial: {
      name: user.name ?? '',
      currentYear: student ? Number(user.currentYear) || undefined : null,
      dietaryRestrictions: Object.values(user.dietaryRestrictions ?? {}).map(
        String,
      ),
    },
    back: '/user',
    saved: () => t('user.profile.saved'),
    save: async (values) => {
      const { profile, account } = toV1Profile(
        user.uid,
        values,
        user.studyProgram,
      )
      await $fetch('/api/v1/user', { method: 'POST', body: profile })
      await $fetch('/api/v1/user', { method: 'PUT', body: account })
      // Min side reads the signed-in user from the store
      auth.user = {
        ...auth.user!,
        name: values.name,
        currentYear: profile.currentYear ?? undefined,
        dietaryRestrictions: profile.dietaryRestrictions,
      }
    },
  })

  const diet = computed({
    get: () => (form.values.dietaryRestrictions as string[] | undefined) ?? [],
    set: (value: string[]) => form.setFieldValue('dietaryRestrictions', value),
  })
</script>

<template>
  <form class="flex max-w-3xl flex-col gap-6" novalidate @submit="submit">
    <NuxtLink
      :to="localePath('/user')"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t('user.profile.back') }}
    </NuxtLink>
    <h1 class="text-4xl font-black tracking-tight">
      {{ $t('user.profile.title') }}
    </h1>

    <section
      class="grid gap-5 rounded-lg border bg-card p-5 lg:grid-cols-2 lg:p-6"
    >
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>{{ $t('user.profile.name') }}</FormLabel>
          <FormControl>
            <Input autocomplete="name" v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <div class="grid content-start gap-2">
        <Label as="p">{{ $t('user.profile.email') }}</Label>
        <p class="flex h-9 items-center truncate">
          {{ user.email }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ $t('user.profile.email_hint') }}
        </p>
      </div>

      <template v-if="student">
        <div class="grid content-start gap-2 lg:col-span-2">
          <Label as="p">{{ $t('user.profile.programme') }}</Label>
          <p class="font-semibold">{{ nameOf(user.studyProgram) || '–' }}</p>
          <p class="text-sm text-muted-foreground">
            {{ $t('user.profile.programme_hint') }}
          </p>
        </div>

        <FormField v-slot="{ value, handleChange }" name="currentYear">
          <FormItem class="lg:col-span-2">
            <FormLabel>{{ $t('user.profile.year') }}</FormLabel>
            <div
              role="radiogroup"
              :aria-label="$t('user.profile.year')"
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="year in years"
                :key="year"
                type="button"
                role="radio"
                :aria-checked="Number(value) === year"
                class="inline-flex h-9 min-w-16 items-center justify-center rounded-md border bg-card px-3 pt-0.5 text-sm font-semibold hover:bg-accent aria-checked:border-plate aria-checked:bg-plate aria-checked:text-plate-foreground"
                @click="handleChange(year)"
              >
                {{ $t('company.admin.year', { n: year }) }}
              </button>
            </div>
            <FieldError />
          </FormItem>
        </FormField>
      </template>
    </section>

    <section
      id="allergier"
      class="flex scroll-mt-24 flex-col gap-4 rounded-lg border bg-card p-5 lg:p-6"
      aria-labelledby="diet-heading"
    >
      <div>
        <h2 id="diet-heading" class="font-bold">
          {{ $t('dietary_restrictions.name') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ $t('user.profile.diet_hint') }}
        </p>
      </div>
      <DietField v-model="diet" :other-label="$t('user.profile.diet_other')" />
    </section>

    <div class="flex flex-wrap gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t('user.profile.save') }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/user')">
          {{ $t('user.profile.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
