<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
  import { useCompanies } from '@/composables/useCompanies'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { STUDY_YEARS } from '@/lib/user/programmes'
  import CheckGroup from '@/components/admin/form/CheckGroup.vue'
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
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
  import { useResourceForm } from '@/composables/admin/useResourceForm'
  import { USER_TYPES, toV1User, UserInput } from '@/contracts/user'
  import { WITHHOLDABLE } from '@/domain/authorization/entitlements'

  const props = defineProps<{
    uid: string
    /** The sign-in address, shown but not edited */
    email: string
    initial: Record<string, unknown>
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()

  const { data: companies } = await useCompanies()
  const companyOptions = computed(() =>
    Object.entries(companies.value ?? {})
      .map(([value, company]) => ({ value, label: company.name ?? value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'nb')),
  )
  const {
    programmes,
    yearsOf: offeredBy,
    codeOf,
    labelOf,
  } = await useProgrammes()
  // before a programme is chosen, the admin may still pick any year
  const yearsOf = (name: unknown) => (name ? offeredBy(name) : STUDY_YEARS)

  const entitlementOptions = computed(() =>
    WITHHOLDABLE.map((entitlement) => ({
      value: entitlement,
      label: t(
        `admin.users.form.entitlement.${entitlement.slice(4).replace(':', '_')}`,
      ),
    })),
  )
  // the form stores what is withheld; the boxes show what is kept
  const kept = (withheld: string[]) =>
    WITHHOLDABLE.filter((entitlement) => !withheld.includes(entitlement))
  const withheldOf = (keeps: string[]) =>
    WITHHOLDABLE.filter((entitlement) => !keeps.includes(entitlement))

  const { form, submit, saving } = useResourceForm({
    schema: UserInput,
    // a profile from before codes stores the name; select the programme it names
    initial: {
      ...props.initial,
      ...('studyProgram' in props.initial && {
        studyProgram: codeOf(props.initial.studyProgram as string),
      }),
    },
    back: '/admin/users',
    saved: () => t('admin.users.form.updated'),
    save: async (values) => {
      const { profile, account, access } = toV1User(props.uid, values)
      await $fetch('/api/v1/user', { method: 'POST', body: profile })
      await $fetch('/api/v1/user', { method: 'PUT', body: account })
      await $fetch('/api/v1/user/access', { method: 'PUT', body: access })
      return props.uid
    },
  })
  const role = computed(() => form.values.userType)
  // the student fields, which only some roles have
  const student = computed(
    () => form.values as { studyProgram?: string; currentYear?: unknown },
  )

  // a year the new programme does not have would be refused later; clear it now
  watch(
    () => student.value.studyProgram,
    (programme) => {
      const year = Number(student.value.currentYear)
      if (year && !yearsOf(programme).includes(year)) {
        form.setFieldValue('currentYear', '' as never)
      }
    },
  )

  const diet = computed({
    get: () => (form.values.dietaryRestrictions as string[] | undefined) ?? [],
    set: (value: string[]) => form.setFieldValue('dietaryRestrictions', value),
  })
</script>

<template>
  <form class="flex max-w-3xl flex-col gap-6" novalidate @submit="submit">
    <NuxtLink
      :to="localePath('/admin/users')"
      class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ $t('admin.users.name') }}
    </NuxtLink>
    <h1
      class="text-2xl leading-8 font-extrabold tracking-tight lg:text-[2rem] lg:leading-10"
    >
      {{ $t('admin.users.form.edit_title') }}
    </h1>

    <section
      class="grid gap-5 rounded-lg border bg-card p-4 lg:grid-cols-2 lg:p-6"
    >
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>{{ $t('admin.users.form.name') }}</FormLabel>
          <FormControl>
            <Input autocomplete="off" v-bind="componentField" />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>

      <div class="grid content-start gap-2">
        <Label as="p">{{ $t('admin.users.form.email') }}</Label>
        <p class="flex h-9 items-center truncate">{{ email }}</p>
        <p class="text-sm text-muted-foreground">
          {{ $t('admin.users.form.email_hint') }}
        </p>
      </div>

      <FormField v-slot="{ componentField }" name="userType">
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.role') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="w-full lg:w-1/2">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem v-for="type in USER_TYPES" :key="type" :value="type">
                {{ $t(`admin.users.role.${type}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            {{ $t(`admin.users.form.role_hint.${role ?? 'basic'}`) }}
          </p>
          <FieldError />
        </FormItem>
      </FormField>

      <FormField
        v-if="role === 'company'"
        v-slot="{ componentField }"
        name="companyUID"
      >
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.company') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="$t('admin.events.form.choose_company')"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem
                v-for="option in companyOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError />
        </FormItem>
      </FormField>

      <template v-else>
        <FormField v-slot="{ componentField }" name="studyProgram">
          <FormItem class="lg:col-span-2">
            <FormLabel>
              {{ $t('admin.users.form.programme') }}
              <span
                v-if="role === 'admin'"
                class="font-normal text-muted-foreground"
              >
                {{ $t('admin.users.form.optional') }}
              </span>
            </FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue
                    :placeholder="$t('admin.users.form.choose_programme')"
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  v-for="programme in programmes"
                  :key="programme.code"
                  :value="programme.code"
                >
                  {{ labelOf(programme) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="currentYear">
          <FormItem class="lg:col-span-2">
            <FormLabel>{{ $t('admin.users.form.year') }}</FormLabel>
            <div
              role="radiogroup"
              :aria-label="$t('admin.users.form.year')"
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="year in yearsOf(student.studyProgram)"
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

      <FormField
        v-if="role === 'company'"
        v-slot="{ value, handleChange }"
        name="withheld"
      >
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.access') }}</FormLabel>
          <p class="text-sm text-muted-foreground">
            {{ $t('admin.users.form.access_hint') }}
          </p>
          <!-- ticked while the person keeps it; unticking withholds it -->
          <CheckGroup
            :model-value="kept((value as string[]) ?? [])"
            :options="entitlementOptions"
            class="flex flex-col"
            @update:model-value="(keeps) => handleChange(withheldOf(keeps))"
          />
          <FieldError />
        </FormItem>
      </FormField>

      <FormField
        v-if="role === 'coordinator'"
        v-slot="{ value, handleChange }"
        name="companyUIDs"
      >
        <FormItem class="lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.companies') }}</FormLabel>
          <p class="text-sm text-muted-foreground">
            {{ $t('admin.users.form.companies_hint') }}
          </p>
          <CheckGroup
            :model-value="(value as string[]) ?? []"
            :options="companyOptions"
            class="grid max-h-64 overflow-y-auto sm:grid-cols-2"
            @update:model-value="handleChange"
          />
          <FieldError />
        </FormItem>
      </FormField>
    </section>

    <section
      class="flex flex-col gap-4 rounded-lg border bg-card p-4 lg:p-6"
      aria-labelledby="diet-heading"
    >
      <div>
        <h2 id="diet-heading" class="font-semibold">
          {{ $t('dietary_restrictions.name') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ $t('admin.users.form.diet_hint') }}
        </p>
      </div>
      <DietField
        v-model="diet"
        :other-label="$t('admin.users.form.diet_other')"
      />
    </section>

    <div class="flex flex-wrap gap-3">
      <Button type="submit" :disabled="saving">
        <Save aria-hidden="true" />
        {{ $t('admin.users.form.save') }}
      </Button>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/admin/users')">
          {{ $t('admin.list.cancel') }}
        </NuxtLink>
      </Button>
    </div>
  </form>
</template>
