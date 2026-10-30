<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
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
  import { dietaryFlags } from '~/config/app.config'

  const auth = useAuthStore()
  const { t } = useI18n()
  const localePath = useLocalePath()

  // a company contact has no study programme or year
  const student = !(auth.currentSubject?.roles.includes('company') ?? false)
  const user = auth.user!

  const { data: programmeData } =
    await useFetch<Record<string, { name?: string; type?: string }>>(
      '/api/v1/programme',
    )
  /** A bachelor runs years 1 to 3 and a master 4 and 5; anything else all five */
  const years = computed(() => {
    const type = Object.values(programmeData.value ?? {}).find(
      (programme) => programme.name === user.studyProgram,
    )?.type
    if (type === 'bachelor') return [1, 2, 3]
    if (type === 'master') return [4, 5]
    return [1, 2, 3, 4, 5]
  })

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

  const KNOWN = dietaryFlags.map((flag) => flag.name)
  const diet = computed<string[]>(
    () => (form.values.dietaryRestrictions as string[] | undefined) ?? [],
  )
  // restrictions typed by hand, kept as one comma-separated field
  const other = ref(diet.value.filter((d) => !KNOWN.includes(d)).join(', '))
  const setDiet = (known: string[], typed: string) =>
    form.setFieldValue('dietaryRestrictions', [
      ...known,
      ...typed
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
    ])
  const toggleDiet = (flag: string) => {
    const known = diet.value.filter((d) => KNOWN.includes(d))
    setDiet(
      known.includes(flag) ? known.filter((d) => d !== flag) : [...known, flag],
      other.value,
    )
  }
  watch(other, (typed) =>
    setDiet(
      diet.value.filter((d) => KNOWN.includes(d)),
      typed,
    ),
  )
</script>

<template>
  <form
    class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-6"
    novalidate
    @submit="submit"
  >
    <NuxtLink
      :to="localePath('/user')"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t('user.profile.back') }}
    </NuxtLink>
    <h1 class="tw:text-4xl tw:font-black tw:tracking-tight">
      {{ $t('user.profile.title') }}
    </h1>

    <section
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-5 tw:lg:grid-cols-2 tw:lg:p-6"
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

      <div class="tw:grid tw:content-start tw:gap-2">
        <Label as="p">{{ $t('user.profile.email') }}</Label>
        <p class="tw:flex tw:h-9 tw:items-center tw:truncate">
          {{ user.email }}
        </p>
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('user.profile.email_hint') }}
        </p>
      </div>

      <template v-if="student">
        <div class="tw:grid tw:content-start tw:gap-2 tw:lg:col-span-2">
          <Label as="p">{{ $t('user.profile.programme') }}</Label>
          <p class="tw:font-semibold">{{ user.studyProgram || '–' }}</p>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('user.profile.programme_hint') }}
          </p>
        </div>

        <FormField v-slot="{ value, handleChange }" name="currentYear">
          <FormItem class="tw:lg:col-span-2">
            <FormLabel>{{ $t('user.profile.year') }}</FormLabel>
            <div
              role="radiogroup"
              :aria-label="$t('user.profile.year')"
              class="tw:flex tw:flex-wrap tw:gap-2"
            >
              <button
                v-for="year in years"
                :key="year"
                type="button"
                role="radio"
                :aria-checked="Number(value) === year"
                class="tw:inline-flex tw:h-9 tw:min-w-16 tw:items-center tw:justify-center tw:rounded-md tw:border tw:bg-card tw:px-3 tw:pt-0.5 tw:text-sm tw:font-semibold tw:hover:bg-accent tw:aria-checked:border-plate tw:aria-checked:bg-plate tw:aria-checked:text-plate-foreground"
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
      class="tw:flex tw:scroll-mt-24 tw:flex-col tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5 tw:lg:p-6"
      aria-labelledby="diet-heading"
    >
      <div>
        <h2 id="diet-heading" class="tw:font-bold">
          {{ $t('dietary_restrictions.name') }}
        </h2>
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('user.profile.diet_hint') }}
        </p>
      </div>
      <div class="tw:flex tw:flex-wrap tw:gap-2">
        <button
          v-for="flag in KNOWN"
          :key="flag"
          type="button"
          :aria-pressed="diet.includes(flag)"
          class="tw:inline-flex tw:h-8 tw:items-center tw:rounded-md tw:border tw:bg-card tw:px-2.5 tw:pt-0.5 tw:text-sm tw:hover:bg-accent tw:aria-pressed:border-plate tw:aria-pressed:bg-plate tw:aria-pressed:text-plate-foreground"
          @click="toggleDiet(flag)"
        >
          {{ $t(`dietary_restrictions.${flag}`) }}
        </button>
      </div>
      <div class="tw:flex tw:flex-col tw:gap-2">
        <Label for="diet-other">{{ $t('user.profile.diet_other') }}</Label>
        <Input id="diet-other" v-model="other" class="tw:lg:w-1/2" />
      </div>
    </section>

    <div class="tw:flex tw:flex-wrap tw:gap-3">
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
