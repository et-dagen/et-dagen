<script setup lang="ts">
  import { ArrowLeft, Save } from '@lucide/vue'
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

  const { data: companies } =
    await useFetch<Record<string, { name?: string }>>('/api/v1/company')
  const companyOptions = computed(() =>
    Object.entries(companies.value ?? {})
      .map(([value, company]) => ({ value, label: company.name ?? value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'nb')),
  )
  const { data: programmeData } =
    await useFetch<Record<string, { name?: string; type?: string }>>(
      '/api/v1/programme',
    )
  const programmes = computed(() =>
    Object.values(programmeData.value ?? {})
      .filter((programme) => programme.name)
      .sort((a, b) => a.name!.localeCompare(b.name!, 'nb')),
  )
  /** A bachelor runs years 1 to 3 and a master 4 and 5; anything else all five */
  const yearsOf = (name: unknown) => {
    const type = programmes.value.find((p) => p.name === name)?.type
    if (type === 'bachelor') return [1, 2, 3]
    if (type === 'master') return [4, 5]
    return [1, 2, 3, 4, 5]
  }

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
    initial: props.initial,
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
  <form
    class="tw:flex tw:max-w-3xl tw:flex-col tw:gap-6"
    novalidate
    @submit="submit"
  >
    <NuxtLink
      :to="localePath('/admin/users')"
      class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
    >
      <ArrowLeft class="tw:size-4" aria-hidden="true" />
      {{ $t('admin.users.name') }}
    </NuxtLink>
    <h1
      class="tw:text-2xl tw:leading-8 tw:font-extrabold tw:tracking-tight tw:lg:text-[2rem] tw:lg:leading-10"
    >
      {{ $t('admin.users.form.edit_title') }}
    </h1>

    <section
      class="tw:grid tw:gap-5 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:grid-cols-2 tw:lg:p-6"
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

      <div class="tw:grid tw:content-start tw:gap-2">
        <Label as="p">{{ $t('admin.users.form.email') }}</Label>
        <p class="tw:flex tw:h-9 tw:items-center tw:truncate">{{ email }}</p>
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('admin.users.form.email_hint') }}
        </p>
      </div>

      <FormField v-slot="{ componentField }" name="userType">
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.role') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="tw:w-full tw:lg:w-1/2">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem v-for="type in USER_TYPES" :key="type" :value="type">
                {{ $t(`admin.users.role.${type}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="tw:text-sm tw:text-muted-foreground">
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
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.company') }}</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger class="tw:w-full">
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
          <FormItem class="tw:lg:col-span-2">
            <FormLabel>
              {{ $t('admin.users.form.programme') }}
              <span
                v-if="role === 'admin'"
                class="tw:font-normal tw:text-muted-foreground"
              >
                {{ $t('admin.users.form.optional') }}
              </span>
            </FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="tw:w-full">
                  <SelectValue
                    :placeholder="$t('admin.users.form.choose_programme')"
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  v-for="programme in programmes"
                  :key="programme.name"
                  :value="programme.name!"
                >
                  {{ programme.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="currentYear">
          <FormItem class="tw:lg:col-span-2">
            <FormLabel>{{ $t('admin.users.form.year') }}</FormLabel>
            <div
              role="radiogroup"
              :aria-label="$t('admin.users.form.year')"
              class="tw:flex tw:flex-wrap tw:gap-2"
            >
              <button
                v-for="year in yearsOf(student.studyProgram)"
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

      <FormField
        v-if="role === 'company'"
        v-slot="{ value, handleChange }"
        name="withheld"
      >
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.access') }}</FormLabel>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.users.form.access_hint') }}
          </p>
          <!-- ticked while the person keeps it; unticking withholds it -->
          <CheckGroup
            :model-value="kept((value as string[]) ?? [])"
            :options="entitlementOptions"
            class="tw:flex tw:flex-col"
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
        <FormItem class="tw:lg:col-span-2">
          <FormLabel>{{ $t('admin.users.form.companies') }}</FormLabel>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('admin.users.form.companies_hint') }}
          </p>
          <CheckGroup
            :model-value="(value as string[]) ?? []"
            :options="companyOptions"
            class="tw:grid tw:max-h-64 tw:overflow-y-auto tw:sm:grid-cols-2"
            @update:model-value="handleChange"
          />
          <FieldError />
        </FormItem>
      </FormField>
    </section>

    <section
      class="tw:flex tw:flex-col tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:lg:p-6"
      aria-labelledby="diet-heading"
    >
      <div>
        <h2 id="diet-heading" class="tw:font-semibold">
          {{ $t('dietary_restrictions.name') }}
        </h2>
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('admin.users.form.diet_hint') }}
        </p>
      </div>
      <DietField
        v-model="diet"
        :other-label="$t('admin.users.form.diet_other')"
      />
    </section>

    <div class="tw:flex tw:flex-wrap tw:gap-3">
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
