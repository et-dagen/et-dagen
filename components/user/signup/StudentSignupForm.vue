<script setup lang="ts">
  import { ChevronRight } from '@lucide/vue'
  import { useForm } from 'vee-validate'
  import { getErrorAlertContext } from '@/composables/useAlerts'
  import { registerUser } from '@/composables/auth/registration'
  import { useProgrammes } from '@/composables/useProgrammes'
  import DietField from '@/components/form/DietField.vue'
  import PasswordInput from '@/components/form/PasswordInput.vue'
  import TextField from '@/components/form/TextField.vue'
  import { useFocusInvalid } from '@/composables/useFocusInvalid'
  import { typedSchemaOf } from '@/lib/forms/zodSchema'
  import FieldError from '@/components/form/FieldError.vue'
  import { Button } from '@/components/ui/button'
  import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
  } from '@/components/ui/form'
  import { StudentSignup } from '@/contracts/user'

  const { programmes, yearsOf } = await useProgrammes()

  const form = useForm({
    validationSchema: typedSchemaOf(StudentSignup),
    initialValues: { dietaryRestrictions: [] },
  })
  const years = computed(() => yearsOf(form.values.studyProgram))
  // a year the new programme does not have would be refused; clear it
  watch(years, (offered) => {
    const year = form.values.currentYear
    if (year && !offered.includes(Number(year))) {
      form.setFieldValue('currentYear', undefined as never, false)
    }
  })

  const diet = computed({
    get: () => form.values.dietaryRestrictions ?? [],
    set: (value: string[]) => form.setFieldValue('dietaryRestrictions', value),
  })

  // after a refused submit, the cursor goes to the first field to fix
  const formEl = ref<HTMLFormElement | null>(null)
  const focusInvalid = useFocusInvalid(formEl)

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
    'h-11 w-full rounded-md border border-input bg-card',
    'px-3 text-base outline-none focus-visible:border-plate',
    'focus-visible:ring-3 focus-visible:ring-plate/15',
    'disabled:opacity-50 aria-invalid:border-destructive',
  ].join(' ')
</script>

<template>
  <form
    ref="formEl"
    novalidate
    class="flex flex-col gap-8 rounded-lg border bg-card p-6 sm:p-8"
    @submit="submit"
  >
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-extrabold tracking-tight">
        {{ $t('signup.student.title') }}
      </h1>
      <p class="text-muted-foreground">{{ $t('signup.student.lead') }}</p>
    </div>

    <fieldset class="flex flex-col gap-5">
      <legend class="mb-4 font-extrabold">
        {{ $t('signup.you') }}
      </legend>
      <TextField
        name="name"
        :label="$t('signup.name')"
        variant="public"
        autocomplete="name"
      />
      <TextField
        name="email"
        :label="$t('signup.email')"
        variant="public"
        type="email"
        autocomplete="email"
        inputmode="email"
      />
      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel>{{ $t('signup.password') }}</FormLabel>
          <FormControl>
            <PasswordInput v-bind="componentField" variant="public" />
          </FormControl>
          <FormDescription>{{ $t('signup.password_hint') }}</FormDescription>
          <FieldError />
        </FormItem>
      </FormField>
    </fieldset>

    <fieldset class="flex flex-col gap-5">
      <legend class="mb-4 font-extrabold">
        {{ $t('signup.studies') }}
      </legend>
      <div class="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <FormField v-slot="{ componentField }" name="studyProgram">
          <FormItem>
            <FormLabel>{{ $t('signup.programme') }}</FormLabel>
            <FormControl>
              <select
                v-bind="componentField"
                :class="[
                  selectClass,
                  !form.values.studyProgram && 'text-muted-foreground',
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

    <details class="group rounded-md border px-4 py-3">
      <summary
        class="flex cursor-pointer list-none items-center gap-2 rounded-sm font-extrabold [&::-webkit-details-marker]:hidden"
      >
        <ChevronRight
          class="size-4 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden="true"
        />
        {{ $t('signup.diet.title') }}
        <span class="font-normal text-muted-foreground">
          {{ $t('signup.optional') }}
        </span>
      </summary>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ $t('signup.diet.lead') }}
      </p>
      <div class="mt-4 flex flex-col gap-4">
        <DietField
          v-model="diet"
          :other-label="$t('user.profile.diet_other')"
        />
      </div>
    </details>

    <div class="flex flex-col gap-3">
      <p
        v-if="error"
        role="alert"
        class="text-sm font-semibold text-destructive"
      >
        {{ error }}
      </p>
      <Button type="submit" size="lg" class="h-11" :disabled="pending">
        {{ $t(pending ? 'signup.pending' : 'signup.student.submit') }}
      </Button>
    </div>
  </form>
</template>
