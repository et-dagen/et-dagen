<script setup lang="ts">
  import { ChevronRight } from '@lucide/vue'
  import { toTypedSchema } from '@vee-validate/zod'
  import { useForm } from 'vee-validate'
  import PasswordInput from './PasswordInput.vue'
  import FieldError from '@/components/admin/form/FieldError.vue'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { StudentSignup } from '@/contracts/user'
  import { yearsOf, type ListedProgramme } from '@/lib/user/programmes'
  import { dietaryFlags } from '~/config/app.config'

  const { t } = useI18n()
  const { data: programmeData } =
    await useFetch<Record<string, ListedProgramme>>('/api/v1/programme')
  const programmes = computed(() =>
    Object.values(programmeData.value ?? {})
      .filter((programme) => programme.name)
      .sort((a, b) => a.name!.localeCompare(b.name!, 'nb')),
  )

  const form = useForm({
    validationSchema: toTypedSchema(StudentSignup),
    initialValues: { dietaryRestrictions: [] },
  })
  const years = computed(() =>
    yearsOf(programmes.value, form.values.studyProgram),
  )
  // a year the new programme does not have would be refused; clear it
  watch(years, (offered) => {
    const year = form.values.currentYear
    if (year && !offered.includes(Number(year))) {
      form.setFieldValue('currentYear', undefined as never, false)
    }
  })

  const diet = computed(() => form.values.dietaryRestrictions ?? [])
  const toggleDiet = (flag: string) =>
    form.setFieldValue(
      'dietaryRestrictions',
      diet.value.includes(flag)
        ? diet.value.filter((d) => d !== flag)
        : [...diet.value, flag],
    )

  // after a refused submit, the cursor goes to the first field to fix
  const formEl = ref<HTMLFormElement | null>(null)
  const focusInvalid = () =>
    nextTick(() =>
      formEl.value
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
    )

  const pending = ref(false)
  const error = ref('')
  const submit = form.handleSubmit(async (values) => {
    pending.value = true
    error.value = ''
    try {
      await registerUser(values)
    } catch (cause) {
      if ((cause as { code?: string }).code === 'auth/email-already-in-use') {
        form.setFieldError('email', 'email_taken')
        await focusInvalid()
      } else {
        error.value = getErrorAlertContext(cause).message
      }
    } finally {
      pending.value = false
    }
  }, focusInvalid)

  const selectClass = [
    'tw:h-11 tw:w-full tw:rounded-md tw:border tw:border-input tw:bg-card',
    'tw:px-3 tw:text-base tw:outline-none tw:focus-visible:border-plate',
    'tw:focus-visible:ring-3 tw:focus-visible:ring-plate/15',
    'tw:disabled:opacity-50 tw:aria-invalid:border-destructive',
  ].join(' ')
  const inputClass = [
    'tw:h-11 tw:focus-visible:border-plate tw:focus-visible:ring-plate/15',
    'tw:aria-invalid:focus-visible:border-destructive',
  ].join(' ')
</script>

<template>
  <form
    ref="formEl"
    novalidate
    class="tw:flex tw:flex-col tw:gap-8 tw:rounded-lg tw:border tw:bg-card tw:p-6 tw:sm:p-8"
    @submit="submit"
  >
    <div class="tw:flex tw:flex-col tw:gap-2">
      <h1 class="tw:text-3xl tw:font-extrabold tw:tracking-tight">
        {{ $t('signup.student.title') }}
      </h1>
      <p class="tw:text-muted-foreground">{{ $t('signup.student.lead') }}</p>
    </div>

    <fieldset class="tw:flex tw:flex-col tw:gap-5">
      <legend class="tw:mb-4 tw:font-extrabold">
        {{ $t('signup.you') }}
      </legend>
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>{{ $t('signup.name') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              autocomplete="name"
              :class="inputClass"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>{{ $t('signup.email') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="email"
              autocomplete="email"
              inputmode="email"
              :class="inputClass"
            />
          </FormControl>
          <FieldError />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel>{{ $t('signup.password') }}</FormLabel>
          <FormControl>
            <PasswordInput v-bind="componentField" :class="inputClass" />
          </FormControl>
          <FormDescription>{{ $t('signup.password_hint') }}</FormDescription>
          <FieldError />
        </FormItem>
      </FormField>
    </fieldset>

    <fieldset class="tw:flex tw:flex-col tw:gap-5">
      <legend class="tw:mb-4 tw:font-extrabold">
        {{ $t('signup.studies') }}
      </legend>
      <div class="tw:grid tw:gap-5 tw:sm:grid-cols-[minmax(0,1fr)_9rem]">
        <FormField v-slot="{ componentField }" name="studyProgram">
          <FormItem>
            <FormLabel>{{ $t('signup.programme') }}</FormLabel>
            <FormControl>
              <select
                v-bind="componentField"
                :class="[
                  selectClass,
                  !form.values.studyProgram && 'tw:text-muted-foreground',
                ]"
              >
                <option value="" disabled selected hidden>
                  {{ $t('signup.choose') }}
                </option>
                <option
                  v-for="programme in programmes"
                  :key="programme.name"
                  :value="programme.name"
                >
                  {{ programme.name }}
                </option>
              </select>
            </FormControl>
            <FieldError />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="currentYear">
          <FormItem>
            <FormLabel>{{ $t('signup.year') }}</FormLabel>
            <FormControl>
              <select
                v-bind="componentField"
                :class="selectClass"
                :disabled="!form.values.studyProgram"
              >
                <option value="" disabled selected hidden>
                  {{ $t('signup.choose') }}
                </option>
                <option v-for="year in years" :key="year" :value="year">
                  {{ $t('signup.year_n', { n: year }) }}
                </option>
              </select>
            </FormControl>
            <FieldError v-if="form.values.studyProgram" />
          </FormItem>
        </FormField>
      </div>
    </fieldset>

    <details class="tw:group tw:rounded-md tw:border tw:px-4 tw:py-3">
      <summary
        class="tw:flex tw:cursor-pointer tw:list-none tw:items-center tw:gap-2 tw:rounded-sm tw:font-extrabold tw:[&::-webkit-details-marker]:hidden"
      >
        <ChevronRight
          class="tw:size-4 tw:text-muted-foreground tw:transition-transform tw:group-open:rotate-90 tw:motion-reduce:transition-none"
          aria-hidden="true"
        />
        {{ $t('signup.diet.title') }}
        <span class="tw:font-normal tw:text-muted-foreground">
          {{ $t('signup.optional') }}
        </span>
      </summary>
      <p class="tw:mt-2 tw:text-sm tw:text-muted-foreground">
        {{ $t('signup.diet.lead') }}
      </p>
      <ul class="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-3">
        <li
          v-for="flag in dietaryFlags"
          :key="flag.name"
          class="tw:flex tw:items-center tw:gap-2"
        >
          <Checkbox
            :id="`diet-${flag.name}`"
            :model-value="diet.includes(flag.name)"
            @update:model-value="toggleDiet(flag.name)"
          />
          <Label :for="`diet-${flag.name}`" class="tw:font-normal">
            {{ t(`dietary_restrictions.${flag.name}`) }}
          </Label>
        </li>
      </ul>
    </details>

    <div class="tw:flex tw:flex-col tw:gap-3">
      <p
        v-if="error"
        role="alert"
        class="tw:text-sm tw:font-semibold tw:text-destructive"
      >
        {{ error }}
      </p>
      <Button type="submit" size="lg" class="tw:h-11" :disabled="pending">
        {{ $t(pending ? 'signup.pending' : 'signup.student.submit') }}
      </Button>
    </div>
  </form>
</template>
